/**
 * 看板娘（TwinSparkBot）服务层类型与常量（纯逻辑层，禁止 import UI）。
 * 状态名与 Rive State Machine 输入一一对应，契约由测试快照守护。
 */

/** 看板娘状态集合（与 Rive 模型状态机的状态名对齐） */
export const COMPANION_STATES = {
  idle: "idle",
  greeting: "greeting",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
} as const;

export type CompanionState =
  (typeof COMPANION_STATES)[keyof typeof COMPANION_STATES];

/** 用户对看板娘的持久化偏好 */
export interface CompanionPreferences {
  /** 已收起为唤起按钮 */
  minimized: boolean;
}

/** Rive 模型中 State Machine 的名称（换模型时须同步，见守护测试） */
export const COMPANION_STATE_MACHINE = "Companion" as const;

/** Rive 形象资产路径（由 public/companion/ 提供，缺失时降级 poster） */
export const COMPANION_RIV_URL = "/companion/companion.riv";

/** 静态海报降级资产路径 */
export const COMPANION_POSTER_URL = "/companion/poster.webp";
