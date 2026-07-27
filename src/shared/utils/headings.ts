/**
 * Markdown 标题提取与 slug 生成（构建期 TOC 数据，基线 §7 正文处理）。
 * 与 Prose 容器的标题 id 生成使用同一 slugify，保证 TOC 锚点可达。
 * 零业务语义（不感知“文章/实验”），故放 shared/utils。
 */

export interface HeadingItem {
  /** 标题层级（2 = h2、3 = h3） */
  depth: 2 | 3;
  /** 标题纯文本 */
  text: string;
  /** 锚点 id（由 slugifyHeading 生成） */
  id: string;
}

/** 标题文本 → 锚点 id：小写、去标点、空白转连字符（保留 CJK） */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()!]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * 从 Markdown/MDX 正文提取 h2/h3 标题（跳过代码块内的 #）。
 * 同名标题追加序号后缀，与 Prose 渲染侧的去重规则一致。
 */
export function extractHeadings(body: string): HeadingItem[] {
  const withoutCode = body.replace(/```[\s\S]*?```/g, "");
  const headings: HeadingItem[] = [];
  const seen = new Map<string, number>();
  for (const line of withoutCode.split(/\r?\n/)) {
    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const depth = (match[1]?.length === 2 ? 2 : 3) as 2 | 3;
    const text = (match[2] ?? "").replace(/\s*#+\s*$/, "");
    headings.push({ depth, text, id: dedupeId(slugifyHeading(text), seen) });
  }
  return headings;
}

/** 渲染侧使用：同一份去重规则（首个不带后缀，重复追加 -1/-2…） */
export function dedupeId(id: string, seen: Map<string, number>): string {
  const count = seen.get(id) ?? 0;
  seen.set(id, count + 1);
  return count === 0 ? id : `${id}-${count}`;
}
