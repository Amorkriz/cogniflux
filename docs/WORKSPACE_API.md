# Workspace API 契约文档

> **状态：已冻结（Frozen）**
> 本文档是 Cogniflux 前端、TwinSparkBot 协调后端、本机 Daemon 三方对齐的**唯一契约**。
> 任何不兼容变更必须升级版本前缀（见 [第 7 章](#7-错误约定与版本化)），不得就地修改本契约语义。

---

## 目录

1. [总览](#1-总览)
2. [鉴权](#2-鉴权)
3. [REST 端点（用户态）](#3-rest-端点用户态)
4. [核心数据类型](#4-核心数据类型)
5. [前端实时通道 WS `/api/v1/realtime`](#5-前端实时通道-ws-apiv1realtime)
6. [Daemon 通道 WS `/api/v1/daemon/ws`](#6-daemon-通道-ws-apiv1daemonws)
7. [错误约定与版本化](#7-错误约定与版本化)

---

## 1. 总览

### 1.1 三层架构

```
┌─────────────────────────────────────────────────────────────┐
│  浏览器（用户）                                                │
│  Cogniflux 静态前端  /workspace 页面                          │
│  （React Router 纯静态站，私有页面）                            │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS 同域请求 /api/*
               ▼
┌─────────────────────────────────────────────────────────────┐
│  nginx（ECS，同域反向代理）                                    │
│  /            → 静态站点资源                                   │
│  /api/*       → 反代至 TwinSparkBot 后端                      │
│  /api/v1/realtime、/api/v1/daemon/ws → WS Upgrade 反代        │
└──────────────┬──────────────────────────────────────────────┘
               │ 内网转发
               ▼
┌─────────────────────────────────────────────────────────────┐
│  TwinSparkBot 协调后端（FastAPI @ ECS）                       │
│  任务队列 / 状态机 / 会话鉴权 / 双 WS 通道调度                    │
└──────────────▲──────────────────────────────────────────────┘
               │ outbound WebSocket（Daemon 主动外连，无需公网入站）
               │ Authorization: Bearer mdtt_xxx
┌──────────────┴──────────────────────────────────────────────┐
│  本机 Daemon（用户 Mac）                                      │
│  注册 Runtime → 心跳 → 认领任务 → 拉起 CLI 进程                 │
│  （Claude Code / Codex / Qoder CLI）→ 回传进度与结果            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 鉴权体系（两条线）

| 主体 | 凭证 | 携带方式 | 生命周期 |
| --- | --- | --- | --- |
| 用户态（浏览器） | JWT | `Cookie: cf_ws_token=<jwt>`，HttpOnly + Secure + SameSite=Strict | 90 天（`Max-Age=7776000`） |
| Daemon 态（本机进程） | `mdtt_` 前缀静态 token | `Authorization: Bearer mdtt_xxxxxxxx` | 长期有效，人工轮换 |

- 用户态凭证由 `POST /api/v1/auth/login` 签发，浏览器 JS 不可读取（HttpOnly）。
- Daemon token 由后端侧生成并人工配置到 Daemon 环境，仅用于 Daemon 通道与降级轮询端点。
- 两条线互不通用：用户态 Cookie 不能访问 `/api/v1/daemon/*`；`mdtt_` token 不能访问用户态专属端点（如 `POST /api/v1/tasks`）。通用只读端点（如 `GET /api/v1/tasks/:taskId`）两者均可访问。

### 1.3 任务状态机

```
                 ┌──────────────────────────────────────────┐
                 │                                          │
 queued ──► dispatched ──► running ──► completed            │
   │             │            │                             │
   │             │            ├──────► failed               │
   │             │            │                             │
   └─────────────┴────────────┴──────► cancelled ◄──────────┘
```

| 迁移 | 触发者 | 说明 |
| --- | --- | --- |
| （创建）→ `queued` | 前端 | `POST /api/v1/tasks` 创建任务，入队等待 |
| `queued` → `dispatched` | Daemon | Daemon 通过 WS `task:assign` 后回 `task:claim-ack`，或降级轮询 `claim-tasks` 认领成功 |
| `dispatched` → `running` | Daemon | CLI 子进程实际启动后，Daemon 上报（首条 `task:progress` 或显式 running 通知），后端置为 running 并记录 `startedAt` |
| `running` → `completed` | Daemon | CLI 正常结束，Daemon 发 `task:complete` |
| `running` → `failed` | Daemon / 后端 | Daemon 发 `task:fail`；或后端失联看护超时判定（`failureReason: "timeout"`） |
| `dispatched` → `failed` | 后端 | Runtime 失联且任务超过 30 分钟未推进（失联看护，见 6.4） |
| `queued` / `dispatched` / `running` → `cancelled` | 前端 | `POST /api/v1/tasks/:taskId/cancel`；若已下发，后端向 Daemon 推 `task:cancel` 终止 CLI 进程 |

终态：`completed`、`failed`、`cancelled`。终态不可再迁移。

### 1.4 多态行动者（Actor）约定

消息与任务中涉及"谁做的"统一使用 actor 结构：

```json
{ "actorType": "user", "actorId": "owner" }
{ "actorType": "agent", "actorId": "agt_01HXXXXXX" }
```

- `actorType`：`"user"`（人）或 `"agent"`（编码 Agent）。
- `actorId`：`user` 时为用户标识（单用户站固定 `"owner"`）；`agent` 时为 Agent 的 `id`。
- 后续扩展新行动者类型（如 `"system"`）属于兼容性新增，消费方遇到未知 `actorType` 应容忍并降级展示。

### 1.5 通用约定

- 所有请求/响应 JSON 字段命名统一 **camelCase**。
- 所有时间字段为 **ISO 8601** 字符串（UTC，如 `"2026-07-28T08:30:00.000Z"`）。
- 请求体 `Content-Type: application/json; charset=utf-8`。
- ID 均为服务端生成的不透明字符串，客户端不得解析其内部结构。

---

## 2. 鉴权

### 2.1 `POST /api/v1/auth/login`

站点私有口令登录，签发用户态会话。

**请求**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `password` | `string` | 是 | 站点私有口令 |

```json
{ "password": "********" }
```

**成功响应 `200`**

```json
{ "ok": true, "expiresAt": "2026-10-26T08:30:00.000Z" }
```

同时下发 Cookie：

```
Set-Cookie: cf_ws_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7776000
```

（`Max-Age=7776000` 即 90 天。）

**失败响应 `401`**

```json
{ "error": "invalid_credentials" }
```

**限流**：同一 IP 每分钟最多 5 次尝试，超出返回 `429`：

```json
{ "error": "rate_limited", "detail": "too many login attempts, retry later" }
```

### 2.2 `POST /api/v1/auth/logout`

登出，清除会话 Cookie。

- 请求体：无。
- 响应 `200`：`{ "ok": true }`，同时 `Set-Cookie: cf_ws_token=; Max-Age=0; ...` 清除 Cookie。

### 2.3 `GET /api/v1/auth/me`

校验当前会话是否有效（前端进入 /workspace 时探测）。

- 有效：`200` → `{ "ok": true }`
- 无效/过期：`401` → `{ "error": "unauthorized" }`

### 2.4 全局鉴权规则

- **除 `POST /api/v1/auth/login` 外**，所有 `/api/v1/*` 端点均要求：有效 `cf_ws_token` Cookie，**或** `Authorization: Bearer mdtt_...` token（限 Daemon 侧端点及通用只读端点）。
- 鉴权失败统一返回 `401`：

```json
{ "error": "unauthorized" }
```

---

## 3. REST 端点（用户态）

以下端点均要求用户态 Cookie 鉴权，字段命名 camelCase。数据类型定义见[第 4 章](#4-核心数据类型)。

### 3.1 `POST /api/v1/tasks` — 创建任务

**请求字段**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `agentId` | `string` | 是 | 目标 Agent 的 `id` |
| `prompt` | `string` | 是 | 任务指令（自然语言） |
| `context` | `object` | 否 | 任务来源上下文 |
| `context.source` | `"direct" \| "chat"` | 否 | 创建来源：直接创建 / 聊天派生，默认 `"direct"` |
| `context.sessionId` | `string` | 否 | 关联的会话 ID（`source` 为 `"chat"` 时使用） |

```json
{
  "agentId": "agt_01HXAAA111",
  "prompt": "为 cogniflux 仓库的 About 页面补充单元测试",
  "context": { "source": "chat", "sessionId": "ses_01HXBBB222" }
}
```

**成功响应 `201`**

```json
{
  "task": {
    "id": "tsk_01HXCCC333",
    "agentId": "agt_01HXAAA111",
    "status": "queued",
    "prompt": "为 cogniflux 仓库的 About 页面补充单元测试",
    "context": { "source": "chat", "sessionId": "ses_01HXBBB222" },
    "seqVersion": 0,
    "createdAt": "2026-07-28T08:30:00.000Z"
  }
}
```

**错误码**

| 状态码 | error | 场景 |
| --- | --- | --- |
| `400` | `invalid_request` | 缺失/非法字段（如 `prompt` 为空） |
| `401` | `unauthorized` | 未登录 |
| `404` | `agent_not_found` | `agentId` 不存在 |

### 3.2 `GET /api/v1/tasks` — 任务列表

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `status` | `string`（CSV） | 否 | 按状态过滤，如 `status=queued,running` |
| `limit` | `number` | 否 | 返回条数上限，默认 20，最大 100 |
| `before` | `string` | 否 | 游标分页：返回该 `taskId` 之前（更早创建）的任务 |

排序：按 `createdAt` 倒序（新→旧）。

**成功响应 `200`**

```json
{
  "tasks": [
    {
      "id": "tsk_01HXCCC333",
      "agentId": "agt_01HXAAA111",
      "status": "running",
      "prompt": "为 About 页面补充单元测试",
      "context": { "source": "direct" },
      "seqVersion": 12,
      "createdAt": "2026-07-28T08:30:00.000Z",
      "startedAt": "2026-07-28T08:30:05.000Z"
    }
  ],
  "total": 42
}
```

**错误码**：`400 invalid_request`（非法参数）、`401 unauthorized`。

### 3.3 `GET /api/v1/tasks/:taskId` — 任务详情（全量快照）

**成功响应 `200`**

```json
{
  "task": {
    "id": "tsk_01HXCCC333",
    "agentId": "agt_01HXAAA111",
    "status": "completed",
    "prompt": "为 About 页面补充单元测试",
    "context": { "source": "direct" },
    "result": { "summary": "新增 3 个测试用例，全部通过", "sessionId": "cc_sess_abc", "workDir": "/Users/me/repo" },
    "seqVersion": 25,
    "createdAt": "2026-07-28T08:30:00.000Z",
    "startedAt": "2026-07-28T08:30:05.000Z",
    "completedAt": "2026-07-28T08:41:12.000Z"
  },
  "messages": [
    { "taskId": "tsk_01HXCCC333", "seq": 1, "type": "log", "content": "开始分析仓库结构", "createdAt": "2026-07-28T08:30:06.000Z" },
    { "taskId": "tsk_01HXCCC333", "seq": 2, "type": "tool_call", "content": "{\"pattern\":\"About\"}", "tool": "grep", "createdAt": "2026-07-28T08:30:08.000Z" }
  ],
  "seqVersion": 25
}
```

**错误码**：`401 unauthorized`、`404 task_not_found`。

### 3.4 `GET /api/v1/tasks/:taskId/messages?fromSeq=<n>` — 增量消息拉取

用于断线补偿：返回 `seq > fromSeq` 的全部消息（按 `seq` 升序）。`fromSeq` 缺省为 `0`（即全量）。

**成功响应 `200`**

```json
{
  "messages": [
    { "taskId": "tsk_01HXCCC333", "seq": 13, "type": "log", "content": "运行测试…", "createdAt": "2026-07-28T08:39:00.000Z" },
    { "taskId": "tsk_01HXCCC333", "seq": 14, "type": "tool_result", "content": "3 passed", "tool": "bash", "createdAt": "2026-07-28T08:40:00.000Z" }
  ],
  "seqVersion": 25
}
```

**错误码**：`400 invalid_request`（`fromSeq` 非法）、`401 unauthorized`、`404 task_not_found`。

### 3.5 `POST /api/v1/tasks/:taskId/cancel` — 取消任务

仅 `queued` / `dispatched` / `running` 状态可取消；若已下发至 Daemon，后端同步推送 `task:cancel` 终止 CLI 进程。

- 请求体：无。

**成功响应 `200`**

```json
{
  "task": {
    "id": "tsk_01HXCCC333",
    "agentId": "agt_01HXAAA111",
    "status": "cancelled",
    "prompt": "为 About 页面补充单元测试",
    "context": { "source": "direct" },
    "seqVersion": 14,
    "createdAt": "2026-07-28T08:30:00.000Z",
    "startedAt": "2026-07-28T08:30:05.000Z",
    "completedAt": "2026-07-28T08:35:00.000Z"
  }
}
```

**错误码**

| 状态码 | error | 场景 |
| --- | --- | --- |
| `401` | `unauthorized` | 未登录 |
| `404` | `task_not_found` | 任务不存在 |
| `409` | `invalid_state` | 任务已处于终态，不可取消 |

### 3.6 `GET /api/v1/agents` — Agent 列表

**成功响应 `200`**

```json
{
  "agents": [
    {
      "id": "agt_01HXAAA111",
      "name": "Claude 主力",
      "slug": "claude-main",
      "description": "日常编码任务",
      "instructions": "遵循仓库 AGENTS.md 规范，先读后写。",
      "provider": "claude-code",
      "status": "idle",
      "maxConcurrentTasks": 1,
      "customEnv": { "HTTP_PROXY": "http://127.0.0.1:7890" },
      "createdAt": "2026-07-01T00:00:00.000Z"
    }
  ]
}
```

### 3.7 `POST /api/v1/agents` — 创建 Agent

**请求字段**

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `name` | `string` | 是 | 展示名称 |
| `slug` | `string` | 是 | URL 友好唯一标识（小写字母、数字、连字符） |
| `description` | `string` | 否 | 描述 |
| `instructions` | `string` | 是 | 系统指令（拉起 CLI 时注入） |
| `provider` | `"claude-code" \| "codex" \| "qoder" \| string` | 是 | CLI 提供方；开放字符串以兼容未来新 CLI |
| `maxConcurrentTasks` | `number` | 否 | 最大并发任务数，默认 `1` |
| `customEnv` | `Record<string, string>` | 否 | 拉起 CLI 进程时附加的环境变量 |

**成功响应 `201`**：`{ "agent": Agent }`（结构同 3.6 单个元素）。

**错误码**：`400 invalid_request`、`401 unauthorized`、`409 slug_conflict`（`slug` 已存在）。

### 3.8 `PATCH /api/v1/agents/:agentId` — 更新 Agent

请求字段与 3.7 相同但**全部可选**，仅更新出现的字段。

**成功响应 `200`**：`{ "agent": Agent }`。

**错误码**：`400 invalid_request`、`401 unauthorized`、`404 agent_not_found`、`409 slug_conflict`。

### 3.9 `DELETE /api/v1/agents/:agentId` — 删除 Agent

**成功响应 `200`**：`{ "ok": true }`。

**错误码**

| 状态码 | error | 场景 |
| --- | --- | --- |
| `401` | `unauthorized` | 未登录 |
| `404` | `agent_not_found` | Agent 不存在 |
| `409` | `agent_busy` | 该 Agent 尚有非终态任务，不可删除 |

### 3.10 `GET /api/v1/runtimes` — Runtime 列表

**成功响应 `200`**

```json
{
  "runtimes": [
    {
      "id": "rt_01HXDDD444",
      "name": "MacBook-Pro.local",
      "status": "online",
      "detectedAgents": ["claude-code", "codex"],
      "lastSeenAt": "2026-07-28T08:41:00.000Z",
      "metadata": { "os": "darwin 26.5.1", "daemonVersion": "0.3.2" }
    }
  ]
}
```

---

## 4. 核心数据类型

以 TypeScript interface 为准，后端 Pydantic 模型按此对标（序列化输出 camelCase）。

```typescript
/** 任务状态 */
type TaskStatus =
  | "queued"      // 已创建，等待 Daemon 认领
  | "dispatched"  // 已下发/被认领，CLI 尚未启动
  | "running"     // CLI 进程执行中
  | "completed"   // 成功终态
  | "failed"      // 失败终态
  | "cancelled";  // 取消终态

/** 任务 */
interface Task {
  id: string;
  agentId: string;
  status: TaskStatus;
  prompt: string;
  context: {
    source?: "direct" | "chat";
    sessionId?: string;
  };
  result?: object;        // 终态 completed 时的结构化结果
  error?: string;         // 终态 failed 时的错误描述
  seqVersion: number;     // 该任务当前最大消息 seq（无消息时为 0）
  createdAt: string;      // ISO 8601
  startedAt?: string;     // 进入 running 的时刻
  completedAt?: string;   // 进入任一终态的时刻
}

/** 任务消息（执行过程流水） */
interface TaskMessage {
  taskId: string;
  seq: number;            // 严格自增，从 1 开始，任务内唯一且无空洞
  type: "log" | "tool_call" | "tool_result" | "error";
  content: string;
  tool?: string;          // type 为 tool_call / tool_result 时的工具名
  createdAt: string;      // ISO 8601
}

/** Agent（编码代理配置） */
interface Agent {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string;
  provider: "claude-code" | "codex" | "qoder" | string;
  status: "idle" | "working" | "offline";
  maxConcurrentTasks: number;
  customEnv?: Record<string, string>;
  createdAt: string;      // ISO 8601
}

/** Runtime（Daemon 注册的运行环境） */
interface Runtime {
  id: string;
  name: string;
  status: "online" | "offline";
  detectedAgents: string[];   // Daemon 本机探测到的可用 CLI provider 列表
  lastSeenAt: string;         // 最近一次心跳时刻，ISO 8601
  metadata: {
    os: string;
    daemonVersion: string;
  };
}
```

补充语义：

- `Task.seqVersion` 与 `TaskMessage.seq` 构成事件补偿协议的基础（见 5.4）。
- `Agent.status` 由后端根据其名下任务与 Runtime 在线状态推导：有 running 任务为 `working`；无在线 Runtime 支持其 provider 时为 `offline`；否则 `idle`。
- `Runtime.detectedAgents` 元素为 provider 标识（如 `"claude-code"`），非 Agent `id`。

---

## 5. 前端实时通道 WS `/api/v1/realtime`

- **鉴权**：复用用户态 Cookie（浏览器 WS 握手自动携带 `cf_ws_token`）；鉴权失败以 HTTP `401` 拒绝升级。
- **方向**：服务端 → 前端单向推送业务事件（前端仅回 pong）。

### 5.1 连接建立

连接成功后服务端**先发**就绪帧：

```json
{ "type": "ready", "timestamp": "2026-07-28T08:30:00.000Z" }
```

前端收到 `ready` 后方可信任后续事件流。

### 5.2 统一信封

所有推送消息使用统一信封：

```json
{
  "type": "task:message",
  "timestamp": "2026-07-28T08:30:06.000Z",
  "payload": { }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 事件名 |
| `timestamp` | `string` | 服务端发出时刻，ISO 8601 |
| `payload` | `object` | 事件负载，按事件类型定义 |

前端遇到未知 `type` 必须忽略（向前兼容）。

### 5.3 事件定义（9 个）

| 事件 `type` | `payload` | 说明 |
| --- | --- | --- |
| `task:queued` | `{ task: Task }` | 新任务入队（含完整 Task） |
| `task:dispatched` | `{ taskId: string, runtimeId: string }` | 任务被某 Runtime 认领 |
| `task:running` | `{ taskId: string, startedAt: string }` | CLI 进程已启动 |
| `task:message` | `{ taskId: string, seq: number, type: "log"\|"tool_call"\|"tool_result"\|"error", content: string, tool?: string }` | 执行过程消息（与 TaskMessage 字段对齐） |
| `task:completed` | `{ taskId: string, result: object, seqVersion: number }` | 成功终态 |
| `task:failed` | `{ taskId: string, error: string, seqVersion: number }` | 失败终态 |
| `task:cancelled` | `{ taskId: string }` | 取消终态 |
| `runtime:online` | `{ runtime: Runtime }` | Runtime 上线（含完整 Runtime） |
| `runtime:offline` | `{ runtimeId: string }` | Runtime 失联下线 |

`payload` 示例（`task:message`）：

```json
{
  "type": "task:message",
  "timestamp": "2026-07-28T08:30:08.000Z",
  "payload": {
    "taskId": "tsk_01HXCCC333",
    "seq": 2,
    "type": "tool_call",
    "content": "{\"pattern\":\"About\"}",
    "tool": "grep"
  }
}
```

### 5.4 事件补偿协议（防丢消息）

1. `task:message` 携带**严格自增** `seq`（任务内从 1 开始，无空洞）。前端为每个任务维护本地最大 seq（`localMaxSeq`）。
2. 前端收到终态事件（`task:completed` / `task:failed`）时，比对 `payload.seqVersion` 与 `localMaxSeq`：
   - 若 `localMaxSeq < seqVersion`，说明中途丢消息，调用
     `GET /api/v1/tasks/:taskId/messages?fromSeq=<localMaxSeq>` 补齐后再落终态 UI。
3. 前端在收流过程中若发现 seq 跳号（收到 `seq = n+2` 而本地为 `n`），同样可主动用 `fromSeq=n` 增量补齐。
4. **WS 重连后**：对所有本地非终态任务逐一调用 `GET /api/v1/tasks/:taskId`（全量快照），以响应中的 `task`、`messages`、`seqVersion` 整体覆盖本地状态。

### 5.5 心跳

- 服务端每 **30s** 发送 WebSocket protocol-level ping；客户端（浏览器自动）回 pong。
- 服务端 **60s** 未收到 pong 则主动断开连接；前端应实现指数退避重连，重连成功后执行 5.4 第 4 条对齐。

---

## 6. Daemon 通道 WS `/api/v1/daemon/ws`

- **鉴权**：握手请求头 `Authorization: Bearer mdtt_xxxxxxxx`；失败以 HTTP `401` 拒绝升级。
- **方向**：双向。信封格式与 5.2 完全一致（`{ type, timestamp, payload }`）。
- Daemon 为 outbound 长连接（Mac 侧主动外连），无需公网入站端口。

### 6.1 Daemon → 服务端消息

| 事件 `type` | `payload` | 说明 |
| --- | --- | --- |
| `daemon:register` | `{ name: string, os: string, daemonVersion: string, detectedAgents: string[] }` | 连接建立后首条消息，注册/更新 Runtime；服务端据此广播 `runtime:online` |
| `daemon:heartbeat` | `{ runningTaskIds: string[] }` | **每 15s** 一次，携带当前本机执行中的任务 ID 列表 |
| `task:claim-ack` | `{ taskId: string }` | 确认接受 `task:assign` 下发的任务；服务端置任务为 `dispatched` |
| `task:progress` | `{ taskId: string, seq: number, type: "log"\|"tool_call"\|"tool_result"\|"error", content: string, tool?: string }` | 执行过程消息；`seq` 由 Daemon 按任务严格自增（从 1 开始）；首条 progress 隐含任务进入 `running` |
| `task:complete` | `{ taskId: string, result: object, sessionId?: string, workDir?: string }` | 任务成功完成；`sessionId`/`workDir` 为 CLI 会话续接信息，合并入 `Task.result` |
| `task:fail` | `{ taskId: string, error: string, failureReason: string }` | 任务失败；`failureReason` 为机器可读原因（如 `"process_exit"`、`"spawn_error"`、`"timeout"`） |

### 6.2 服务端 → Daemon 消息

| 事件 `type` | `payload` | 说明 |
| --- | --- | --- |
| `task:assign` | `{ task: Task, agent: Agent }` | 下发任务，携带**完整 Agent 配置**（`instructions`、`provider`、`customEnv` 等）供 Daemon 拉起对应 CLI；Daemon 须回 `task:claim-ack` |
| `task:cancel` | `{ taskId: string }` | 要求终止对应 CLI 进程；Daemon 终止后无需额外回执，服务端已将任务置 `cancelled` |

### 6.3 降级轮询（WS 不可用时）

Daemon 若无法维持 WS 连接，退化为 HTTP 轮询模式（均要求 `mdtt_` token）：

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/api/v1/daemon/claim-tasks?limit=3` | `GET` | **每 3s** 轮询认领；服务端原子性地把至多 `limit` 个 `queued` 任务置为 `dispatched` 并返回 `{ tasks: Task[], agents: Record<string, Agent> }`（`agents` 以 `agentId` 为键，含完整配置）。`limit` 取值 `0`–`100`；**`limit=0` 为仅保活请求**：只刷新 Runtime 心跳（last seen），不认领任何任务，返回空 `tasks` —— 供 Daemon 满载（无空闲执行槽位）时使用，避免被 6.4 心跳超时误判 offline |
| `/api/v1/daemon/tasks/:taskId/messages` | `POST` | 回传进度，请求体同 `task:progress` 的 payload（不含 `taskId`）：`{ seq, type, content, tool? }` → `200 { "ok": true }` |
| `/api/v1/daemon/tasks/:taskId/complete` | `POST` | 请求体同 `task:complete` 的 payload（不含 `taskId`）→ `200 { "task": Task }` |
| `/api/v1/daemon/tasks/:taskId/fail` | `POST` | 请求体同 `task:fail` 的 payload（不含 `taskId`）→ `200 { "task": Task }` |

轮询模式下心跳由 `claim-tasks` 请求本身充当（每次请求即视为一次心跳）；因此 Daemon 即使满载也应持续以 `limit=0` 轮询保活。

### 6.4 失联看护

- 服务端 **45s** 未收到某 Runtime 心跳（WS `daemon:heartbeat` 或轮询请求），判定该 Runtime `offline`，广播 `runtime:offline`。
- 失联 Runtime 名下处于 `dispatched` / `running` 的任务进入超时观察：自最后一次收到该任务相关消息起 **30 分钟**内 Runtime 未恢复并续传，任务置为 `failed`，`error` 写入失联说明，`failureReason: "timeout"`，并向前端广播 `task:failed`。
- Runtime 恢复连接后重新 `daemon:register`，并在 `daemon:heartbeat.runningTaskIds` 中申明仍在执行的任务，后端据此解除对应任务的超时观察。

---

## 7. 错误约定与版本化

### 7.1 统一错误体

所有非 2xx 响应统一返回：

```json
{ "error": "string（机器可读错误码，snake_case）", "detail": "string（可选，人类可读补充）" }
```

### 7.2 状态码语义表

| 状态码 | 典型 `error` | 语义 |
| --- | --- | --- |
| `400` | `invalid_request` | 请求体/参数校验失败 |
| `401` | `unauthorized` / `invalid_credentials` | 未认证或凭证无效（全站统一 `unauthorized`；仅 login 用 `invalid_credentials`） |
| `403` | `forbidden` | 已认证但无权（如 `mdtt_` token 访问用户态专属端点） |
| `404` | `task_not_found` / `agent_not_found` / `not_found` | 资源不存在 |
| `409` | `invalid_state` / `slug_conflict` / `agent_busy` | 状态冲突（如取消终态任务、slug 重复） |
| `429` | `rate_limited` | 触发限流（如登录每 IP 每分钟 5 次） |
| `500` | `internal_error` | 服务端未预期错误 |
| `503` | `service_unavailable` | 依赖不可用/维护中 |

### 7.3 版本化策略

- 路径前缀 `/api/v1/` 即 API 版本。
- **兼容性变更**（可就地进行）：新增可选请求字段、新增响应字段、新增事件 `type`、新增端点。消费方必须容忍未知字段与未知事件。
- **不兼容变更**（必须升 `v2`）：删除/重命名字段、修改字段类型或语义、修改状态机迁移规则、修改鉴权方式。
- `v1` 与 `v2` 并存期内旧版本至少维护至所有三方（前端 / 后端 / Daemon）完成迁移。

---

*本契约一经三方确认即冻结；实现过程中如发现契约缺陷，须回到本文档先行修订并同步三方，再改代码。*
