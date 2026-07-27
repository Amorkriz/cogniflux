# ADR-008 Agent 安全边界：Gateway 接口 + 阶段 3 BFF

- 状态：已采纳（2026-07）
- 相关：基线 §3 原则 9、§13、`src/services/agent/`

## 背景

Agent 能力是本站长期方向，但真实 LLM 调用需要密钥。前端持 Key = 泄露；伪造一个假后端 = 过度设计。需要在两者之间划定"第一天就预留、但只预留到接口为止"的边界。

## 决策

- 阶段 1 仓库中与 Agent 相关的**只有两个文件**：`src/services/agent/gateway.ts`（`AgentGateway` 接口：`validateInput(req)` + `invoke(req)` 重载——按 `stream` 返回 `AgentResponse` 或 `AsyncIterable<AgentEvent>`）与 `mock.ts`（mock 实现）。
- **前端永不持有模型 Key**：`.env` 只允许 `VITE_` 前缀的公开配置；密钥类变量永不写入仓库任何文件。
- 阶段 3 调用链：输入校验（前端 UX 级）→ **BFF**（专为前端服务的轻量后端转发层：持 Key、鉴权、速率限制、成本上限、审计日志）→ LLM/Agent runtime。

## 理由

- 接口先行使 Agent 能力上线时不重构前端调用链：把 mock 换成 fetch 实现即可，页面调用签名不变。
- Key 管理/限流/审计天然属于服务端职责——`validateInput` 明确标注为 UX 级校验，**非安全边界**。
- 不伪造后端：mock 只为 UI 演示与接口验证，避免为想象需求建假服务。

## 后果

- `src/services/agent/` 禁止出现任何真实密钥与 LLM SDK 调用（目录职责表 + 评审拦截）。
- 事件流类型（`start/delta/tool/done/error`）现在定型，UI 增量渲染逻辑可先行开发。
- UX 级输入约束共享常量（`AGENT_INPUT_LIMITS`），mock 与未来实现复用。
- BFF 形态（Vercel Functions vs 独立服务）刻意不决策，留到阶段 3。

## 重新评估条件

真实 Agent 能力上线（阶段 3）时：决策 BFF 形态、落地鉴权/限流/成本上限/审计四件套、接入 Sentry；若接口形态不满足流式协议演进（如需双向通道），先改接口再动实现。
