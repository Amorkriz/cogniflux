# Cogniflux 内容写作规范

> frontmatter 字段字典与 `src/domains/*/schema.ts`、`src/content-io/validate.ts` 的 Zod schema 逐字段一致；坏 frontmatter 会导致构建失败（报错含文件路径）。写作前可复制 `content/_templates/` 下的模板。

## 1. 内容类型与存放位置

| 类型 | 格式 | 位置 | 路由 |
|---|---|---|---|
| Article（文章） | MDX | `content/articles/{年}/{slug}/index.mdx` | `/writing/{slug}` |
| Lab（实验记录） | MDX | `content/lab/{slug}.mdx` | `/lab/{slug}` |
| Project（项目） | TS 数据 | `content/data/projects.ts` | `/projects/{slug}` |
| Agent | TS 数据 | `content/data/agents.ts` | `/agents/{slug}` |
| Tool（工具） | TS 数据 | `content/data/tools.ts` | `/toolbox`（纯列表，无详情页） |
| NowUpdate（近况） | TS 数据 | `content/data/now.ts` | `/now`（按月倒序时间线） |
| Profile（个人档案） | TS 数据（单例） | `content/data/profile.ts` | `/about` |
| SiteSettings / Navigation / spotlight | TS 数据（单例） | `content/data/site.ts` | 全站 |

> **路径模式约束（与代码一致，违规即校验失败）**：文章必须为 `content/articles/{4位年份}/{slug}/index.mdx`（年份目录限 4 位数字，slug 目录下只识别 `index.mdx`）；Lab 必须为顶层 `content/lab/{slug}.mdx`，**不允许子目录**。该形态与 `src/content-io/loader.ts` 的 glob、`scripts/validate-content.ts` 与 `scripts/content-urls.ts` 的扫描规则完全一致；不符合形态的 .mdx 会被 `pnpm validate-content` 报路径结构错误（含文件路径），避免出现 sitemap/RSS 列出但运行时 404 的漂移。

## 2. frontmatter 字段字典

### 2.1 基座字段（BaseContent，全部可发布内容共享）

对应 `src/content-io/validate.ts` 的 `baseContentSchema`：

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `slug` | string | 是 | URL 标识；正则 `^[a-z0-9]+(?:-[a-z0-9]+)*$`（小写字母/数字 + 连字符） |
| `title` | string | 是 | 标题，非空 |
| `summary` | string | 是 | 列表页摘要，≤160 字，兼作默认 SEO description |
| `status` | `draft \| published \| archived` | 是 | 发布状态，见 §4 draft 语义 |
| `visibility` | `public \| private` | 否（默认 `public`） | 可见性（ADR-010）：`private` 详情页照常 prerender，但由 nginx `auth_request` 拦截，仅作者登录可读；见 §4.1 私密中性约定 |
| `createdAt` | ISO 日期字符串 | 是 | 如 `2026-07-26`（YAML 裸日期会被自动归一化为 ISO 字符串） |
| `updatedAt` | ISO 日期字符串 | 否 | 更新时间 |
| `tags` | string[] | 否（默认 `[]`） | 标签 |
| `cover` | `{ src, alt }` | 否 | 封面；**`cover.alt` 必填（无障碍红线）**；`src` 用相对路径指向同目录图片 |
| `featured` | boolean | 否 | 首页跨类型精选标记 |
| `featuredOrder` | number | 否 | 精选排序 |
| `seo` | `{ title?, description?, ogImage? }` | 否 | 覆盖默认 SEO（默认 title=title、description=summary） |

### 2.2 Article 扩展（`src/domains/articles/schema.ts`）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `category` | `engineering \| agents \| thinking \| buildlog` | 是 | 文章分类 |
| `series` | string | 否 | 系列名 |
| `seriesIndex` | 正整数 | 否 | 系列内序号 |
| `lang` | string | 否（默认 `"zh"`） | 内容语言 |
| `related` | ContentRef[] | 否（默认 `[]`） | 正向引用，见 §6 |

> `readingTime` 由 repository 构建期从正文估算（中文 ~400 字/分、英文 ~200 词/分），**不写在 frontmatter 中**。

### 2.3 Lab 扩展（`src/domains/lab/schema.ts`）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `hypothesis` | string | 是 | 想验证的假设 |
| `outcome` | `success \| failed \| ongoing \| paused` | 是 | 实验结果；**失败实验是一等公民**，`failed` 正常展示 |
| `learnings` | string[] | 否（默认 `[]`） | 学到了什么 |
| `related` | ContentRef[] | 否（默认 `[]`） | 正向引用 |

### 2.4 Project 扩展（`src/domains/projects/schema.ts`，TS 数据）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `techStack` | string[] | 否（默认 `[]`） | 技术栈 |
| `projectStatus` | `active \| completed \| archived \| in-progress` | 是 | 项目状态；与发布 `status` 分离——归档项目仍可展示 |
| `period` | `{ start, end? }` | 是（start 必填） | 项目时间段 |
| `links` | `{ repo?, demo?, docs? }` | 否（默认 `{}`） | 外链 |
| `highlights` | string[] | 否（默认 `[]`） | 亮点 |
| `related` | ContentRef[] | 否（默认 `[]`） | 正向引用 |

### 2.5 Agent 扩展（`src/domains/agents/schema.ts`，TS 数据）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `role` | string | 是 | 一句话角色定位 |
| `capabilities` | string[] | 否（默认 `[]`） | 能力清单 |
| `stack` | string[] | 否（默认 `[]`） | 模型/框架技术栈 |
| `agentStatus` | `concept \| building \| usable \| retired` | 是 | 驱动 AgentStatusBadge 徽章；详情页"当前局限"区块基于此状态文案生成（schema 无 `limitations` 字段） |
| `demo` | `{ type: 'video'\|'link'\|'embed', src }` | 否 | 演示入口 |
| `related` | ContentRef[] | 否（默认 `[]`） | 正向引用 |

### 2.6 Tool 扩展（`src/domains/toolbox/schema.ts`，TS 数据）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `category` | `dev \| ai \| productivity \| hardware \| method` | 是 | 工具分类 |
| `url` | string | 否 | 官网链接 |
| `useCase` | string | 是 | 我用它做什么 |
| `recommendLevel` | 整数 1–3 | 是 | 推荐等级 |

> Tool **没有 `related` 字段**：工具可被其他内容引用（`kind: 'tool'`），但自身不引用。

### 2.7 NowUpdate 扩展（`src/domains/now/schema.ts`，TS 数据）

| 字段 | 类型 | 必填 | 语义 |
|---|---|---|---|
| `date` | string | 是 | 记录月份对应日期 |
| `focus` | string[] | 否（默认 `[]`） | 当前方向 |
| `entries` | `{ category, text, link? }[]` | 否（默认 `[]`） | `category`：`building \| learning \| reading \| thinking` |

> 每月一条记录，slug 形如 `2026-07`。

### 2.8 Profile（`src/domains/profile/schema.ts`，单例，非发布物）

不继承 BaseContent（无 slug/status）：`name`、`title`、`bio`、`story`、`avatar` 均必填字符串；`skills: { group, items[] }[]`；`socials: { platform, url }[]`。

### 2.9 Site（`src/domains/site/schema.ts`，单例）

- `siteSettings`：`title / description / url / defaultOg / locale` 全必填。
- `navigation`：`main / footer` 为 `{ label, href, order }[]`；8 个固定栏目显式配置，不从内容自动生成。
- `spotlight`：一个 ContentRef（首页跨类型精选），渲染时经反向关联聚合器解析。

## 3. slug 纪律

- 小写字母/数字 + 连字符（Zod 正则强制），不含日期（日期在目录层与 frontmatter）。
- 文章 slug 须与目录名一致；Lab slug 须与文件名一致（CI 校验唯一性）。
- **发布后不改**——slug 即 URL 永久性承诺；确需更改则做 301/`meta refresh` + 别名表。

## 4. draft 语义

- `status: draft`：dev 模式可见（详情页带 DRAFT 角标），**生产构建过滤**——不进 prerender 路径、不进 sitemap/RSS。
- `status: published`：正式发布，进入构建与 SEO 产物。
- `status: archived`：归档，不在列表展示。
- 项目/Agent 的业务状态（`projectStatus` / `agentStatus`）与发布 `status` 相互独立。

### 4.1 私密文章中性约定（`visibility: private`，ADR-010，仅 Article）

私密文章的 frontmatter **不得含任何秘密**（frontmatter 会随 eager glob 进入公开 JS chunk），`pnpm validate-content` 强制校验以下约束，违反即构建失败：

- `status` 必须为 `published`（私密与草稿语义不得混用）；
- `slug` 必须为中性编号 `p-年份-序号`（如 `p-2026-001`，正则 `^p-\d{4}-\d{3}$`）；
- `title` 固定为“私密文章”，`summary` 置空或固定为“该文章仅作者可见。”；**真实标题写在 MDX 正文首个 H1**（随正文受保护）；
- 不得设置 `cover` / `seo` / `related`（避免元数据与关联链路泄露）。

反向约束：公开文章 slug 不得以“p-数字”形态开头（会误撞 nginx 保护路径 `/writing/p-`）。

衍生行为：私密文章无 readingTime/TOC（原文被排除出公开 chunk）；列表页展示中性占位卡；不进首页最新/反向关联/sitemap/RSS；正文 chunk 输出到 `assets/private/` 受口令门保护。

## 5. _templates 用法

1. 复制模板：文章复制 `content/_templates/article.mdx` 到 `content/articles/{年}/{slug}/index.mdx`；实验复制 `content/_templates/lab.mdx` 到 `content/lab/{slug}.mdx`。
2. 按模板内注释修改 frontmatter（注释掉的字段按需启用）。
3. 本地 `pnpm validate-content` 自检；`pnpm dev` 预览（draft 可见）。

## 6. related 引用与反向关联

- 正向引用写在 frontmatter/数据的 `related`，每项为 `{ kind, slug }`（ContentRef）；`kind` 取 `article | project | agent | lab | tool`。
- **只存 kind+slug、不存 title**：避免改标题后引用过期，渲染时由 `src/domains/site/references.ts` 的 `resolveRefs` 解析为 title/href。
- 反向关联（"被这些内容引用"）由 `getReferencesTo` 构建期扫描全量 `related` 自动生成，**作者无需双向维护**。
- 悬空引用（目标不存在）在渲染时自动跳过，不会构建失败。

## 7. 图片规范

- 文章配图与文章**同目录**存放（`content/articles/{年}/{slug}/`），frontmatter/正文中用相对路径（如 `./cover.png`），随文迁移。
- `cover.alt` 必填（Zod 强制，无障碍红线）。
- 单图 <500KB；品牌资源（logo、默认 OG 图）放 `public/`。
