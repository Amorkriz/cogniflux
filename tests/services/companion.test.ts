import { afterEach, describe, expect, it, vi } from "vitest";

import {
  agentEventToCompanionState,
  COMPANION_MINIMIZED_KEY,
  COMPANION_STATE_MACHINE,
  COMPANION_STATES,
  getCompanionPrefs,
  setCompanionMinimized,
} from "@/services/companion";

/** 用 Map 模拟可用的 localStorage（测试环境为 node，无真实 window） */
function stubWorkingLocalStorage(): Map<string, string> {
  const store = new Map<string, string>();
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => void store.set(key, value),
    },
  });
  return store;
}

/** 模拟 localStorage 抛异常（隐私模式 / 配额满等） */
function stubThrowingLocalStorage(): void {
  vi.stubGlobal("window", {
    localStorage: {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("companion prefs（localStorage 持久化）", () => {
  it("默认（无 window）返回 false", () => {
    expect(getCompanionPrefs()).toEqual({ minimized: false });
  });

  it("正常读写往返：写入后能读回", () => {
    const store = stubWorkingLocalStorage();
    setCompanionMinimized(true);
    expect(store.get(COMPANION_MINIMIZED_KEY)).toBe("true");
    expect(getCompanionPrefs()).toEqual({ minimized: true });

    setCompanionMinimized(false);
    expect(getCompanionPrefs()).toEqual({ minimized: false });
  });

  it("localStorage 抛异常时静默降级，不抛错", () => {
    stubThrowingLocalStorage();
    expect(() => setCompanionMinimized(true)).not.toThrow();
    expect(getCompanionPrefs()).toEqual({ minimized: false });
  });
});

describe("companion bridge（AgentEvent → CompanionState）", () => {
  it("五种事件映射全覆盖", () => {
    expect(
      agentEventToCompanionState({ type: "start", requestId: "r1" }),
    ).toBe(COMPANION_STATES.thinking);
    expect(agentEventToCompanionState({ type: "delta", text: "你好" })).toBe(
      COMPANION_STATES.speaking,
    );
    expect(agentEventToCompanionState({ type: "tool", name: "search" })).toBe(
      COMPANION_STATES.thinking,
    );
    expect(
      agentEventToCompanionState({ type: "done", requestId: "r1" }),
    ).toBe(COMPANION_STATES.idle);
    expect(
      agentEventToCompanionState({ type: "error", message: "boom" }),
    ).toBe(COMPANION_STATES.idle);
  });
});

describe("companion 契约守护", () => {
  // 守护测试：状态名与 Rive State Machine 契约绑定，
  // 换 Rive 模型时若状态名漂移，此快照会失败以强制同步评审。
  it("COMPANION_STATES 快照固定，防止状态名漂移", () => {
    expect(COMPANION_STATES).toMatchInlineSnapshot(`
      {
        "greeting": "greeting",
        "idle": "idle",
        "listening": "listening",
        "speaking": "speaking",
        "thinking": "thinking",
      }
    `);
  });

  it("State Machine 名称固定为 Companion", () => {
    expect(COMPANION_STATE_MACHINE).toBe("Companion");
  });
});
