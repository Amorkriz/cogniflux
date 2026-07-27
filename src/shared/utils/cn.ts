import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** 统一 className 合并：clsx 组合条件类 + tailwind-merge 去重冲突类（基线 §9） */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
