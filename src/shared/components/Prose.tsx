import type { ComponentProps, ComponentType, ReactNode } from "react";
import { isValidElement } from "react";

import { cn } from "@/shared/utils";
import { dedupeId, slugifyHeading } from "@/shared/utils/headings";

export interface ProseProps {
  /** MDX 编译产物组件（领域 repository 的 load() 结果） */
  body: ComponentType<{ components?: Record<string, ComponentType<never>> }>;
  className?: string;
}

/** 递归提取 ReactNode 的纯文本（标题锚点 id 生成用） */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/**
 * 每次渲染重建 h2/h3 映射：同一渲染趟内共享去重 map，
 * id 生成规则与 extractHeadings 一致 => TOC 锚点必达。
 */
function createHeadingComponents() {
  const seen = new Map<string, number>();
  const make = (Tag: "h2" | "h3") =>
    function ProseHeading({ children, ...rest }: ComponentProps<"h2">) {
      const id = dedupeId(slugifyHeading(textOf(children)), seen);
      return (
        <Tag id={id} {...rest}>
          {children}
        </Tag>
      );
    };
  return { h2: make("h2"), h3: make("h3") };
}

/**
 * MDX 渲染容器（基线 §10）：.prose 排版（typography 插件 + 令牌定制，65ch），
 * 并为 h2/h3 注入锚点 id（TOC 跳转）。
 */
export function Prose({ body: Body, className }: ProseProps) {
  const components = createHeadingComponents();
  return (
    <div className={cn("prose", className)}>
      <Body components={components} />
    </div>
  );
}
