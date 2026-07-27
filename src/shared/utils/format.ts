/**
 * 日期展示格式化（列表/详情/时间线共用，零业务语义）。
 * 内容层日期均为 ISO 字符串（YYYY-MM-DD 或 YYYY-MM）。
 */

/** ISO 日期 → 本地化长日期（如 2026年7月26日） */
export function formatDate(iso: string, locale = "zh-CN"): string {
  const date = new Date(iso.length === 7 ? `${iso}-01` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** ISO 年月（YYYY-MM）→ 本地化年月（如 2026年7月） */
export function formatMonth(isoMonth: string, locale = "zh-CN"): string {
  const date = new Date(`${isoMonth.slice(0, 7)}-01`);
  if (Number.isNaN(date.getTime())) return isoMonth;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(date);
}
