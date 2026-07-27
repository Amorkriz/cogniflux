import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * 令牌对比度护栏（视觉改版方案 §8）：
 * 解析 tokens.css + themes/{light,dark}.css 的 CSS 变量，
 * 沿 var() 引用链解析到最终 hex，按 WCAG 2.x 相对亮度公式
 * 断言双主题关键文本/背景组合 ≥4.5:1（AA）。
 * 非纯色令牌（渐变 / rgb() 带透明度等）不参与断言（见 resolveColor 说明）。
 */

const stylesDir = path.resolve(import.meta.dirname, "../../src/styles");

/** 解析一段 CSS 文本中的自定义属性声明为 Map（值可跨行，如 gradient） */
function parseCssVars(css: string): Map<string, string> {
  const vars = new Map<string, string>();
  // 去掉注释，避免注释内示例值干扰
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of stripped.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    const [, name, value] = m;
    if (name && value) vars.set(name, value.replace(/\s+/g, " ").trim());
  }
  return vars;
}

/**
 * 沿 var(--x) 引用链解析令牌，返回最终 hex 颜色；
 * 若最终值不是纯色 hex（如 linear-gradient / conic-gradient /
 * rgb(... / alpha)），返回 null —— 调用方跳过该组合。
 */
function resolveColor(
  name: string,
  vars: Map<string, string>,
  depth = 0,
): string | null {
  if (depth > 10) return null; // 防循环引用
  const value = vars.get(name);
  if (!value) return null;
  const ref = /^var\(--([\w-]+)\)$/.exec(value);
  if (ref?.[1]) return resolveColor(ref[1], vars, depth + 1);
  return /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? value : null;
}

/** hex → [r, g, b]（0-255），支持 #rgb / #rrggbb */
function hexToRgb(hex: string): [number, number, number] {
  let h = hex.slice(1);
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** WCAG 2.x 相对亮度 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  const lin = (c: number): number => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 对比度 (L1 + 0.05) / (L2 + 0.05) */
function contrastRatio(fgHex: string, bgHex: string): number {
  const l1 = relativeLuminance(fgHex);
  const l2 = relativeLuminance(bgHex);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const tokensVars = parseCssVars(
  readFileSync(path.join(stylesDir, "tokens.css"), "utf-8"),
);

function themeVars(file: string): Map<string, string> {
  const overrides = parseCssVars(
    readFileSync(path.join(stylesDir, "themes", file), "utf-8"),
  );
  return new Map([...tokensVars, ...overrides]);
}

const themes = [
  ["light", themeVars("light.css")],
  ["dark", themeVars("dark.css")],
] as const;

/** 关键文本/背景组合（方案 §8 验收清单） */
const pairs: ReadonlyArray<[fg: string, bg: string]> = [
  ["text-primary", "bg-base"],
  ["text-secondary", "bg-base"],
  ["text-secondary", "bg-surface"],
  ["text-secondary", "bg-raised"],
  ["accent", "bg-base"],
  ["accent-secondary", "bg-base"],
  ["accent-tertiary", "bg-base"],
  ["accent-warm", "bg-base"],
  ["accent-pink", "bg-base"],
];

describe.each(themes)("令牌对比度（%s 主题，WCAG AA ≥4.5:1）", (theme, vars) => {
  it.each(pairs)("--%s on --%s ≥4.5:1", (fg, bg) => {
    const fgHex = resolveColor(fg, vars);
    const bgHex = resolveColor(bg, vars);
    // 令牌若为渐变等非纯色（resolveColor 返回 null）则跳过断言：
    // 当前关键组合均应为纯色，解析失败视为测试缺陷，直接断言存在
    expect(fgHex, `--${fg} 应解析为纯色 hex`).toBeTruthy();
    expect(bgHex, `--${bg} 应解析为纯色 hex`).toBeTruthy();
    const ratio = contrastRatio(fgHex!, bgHex!);
    // 输出实测值供验收报告引用
    console.log(
      `[contrast][${theme}] --${fg} ${fgHex} on --${bg} ${bgHex} = ${ratio.toFixed(2)}:1`,
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});
