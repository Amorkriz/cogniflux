import { StatusCapsule } from "@/shared/ui";

/**
 * 首页 Hero 右列装饰（页面内组件，不导出到任何 index.ts 桶）：
 * 纯 CSS/JSX 拼装的开发者工作台场景——终端窗口 + 浮动代码片段 +
 * Agent 节点连线（内联 SVG）+ 聊天气泡 + 状态面板。
 * 红线合规：整体 aria-hidden（不承载内容）；动效只用 animate-float /
 * animate-pulse-glow / animate-breathe 且均配 motion-reduce:animate-none；
 * 浮动小卡一律普通 surface 卡样式，禁用 .glass（浮动 + backdrop-filter
 * 是合成成本最高的组合，见 docs/DESIGN.md §8 glass 白名单）；
 * 内联 style 仅允许 animation-delay（错峰浮动）；零新 JS 依赖。
 * lg 以下整体隐藏（移动端仅保留 HeroSection 的背景光晕）。
 */
export function HeroDecoration() {
  return (
    <div aria-hidden="true" className="relative hidden select-none py-10 lg:block">
      {/* ① 终端窗口卡片：圆点窗控 + mock 命令行输出 */}
      <div className="relative z-10 mx-auto w-full max-w-sm rounded-card border border-default bg-surface shadow-card">
        <div className="flex items-center gap-1.5 border-b border-default px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-danger" />
          <span className="size-2.5 rounded-full bg-warning" />
          <span className="size-2.5 rounded-full bg-success" />
          <span className="ml-2 font-mono text-xs text-tertiary">
            cogniflux · zsh
          </span>
        </div>
        <div className="flex flex-col gap-1.5 px-4 py-3 font-mono text-xs">
          <p className="text-secondary">
            <span className="text-accent-tertiary">$</span> agent deploy --target
            prod
          </p>
          <p className="text-tertiary">
            <span className="text-success">✓</span> tools linked · memory ready
          </p>
          <p className="text-secondary">
            <span className="animate-pulse-glow text-success motion-reduce:animate-none">
              ●
            </span>{" "}
            cogniflux-agent <span className="text-success">online</span>
          </p>
        </div>
      </div>

      {/* ③ Agent 节点连线：线用 --bg-grid-line 类比色（stroke-current + text-strong），
       * 节点圆点 pulse-glow 呼吸发光 */}
      <svg
        viewBox="0 0 320 96"
        className="mx-auto mt-2 block w-full max-w-sm"
        fill="none"
      >
        <line
          x1="160"
          y1="8"
          x2="48"
          y2="72"
          strokeWidth={1}
          className="stroke-current text-strong"
        />
        <line
          x1="160"
          y1="8"
          x2="160"
          y2="80"
          strokeWidth={1}
          className="stroke-current text-strong"
        />
        <line
          x1="160"
          y1="8"
          x2="272"
          y2="64"
          strokeWidth={1}
          className="stroke-current text-strong"
        />
        <circle
          cx="160"
          cy="8"
          r="5"
          className="animate-pulse-glow fill-current text-accent motion-reduce:animate-none"
        />
        <circle
          cx="48"
          cy="72"
          r="4"
          className="animate-pulse-glow fill-current text-accent-secondary motion-reduce:animate-none"
          style={{ animationDelay: "0.8s" }}
        />
        <circle
          cx="160"
          cy="80"
          r="4"
          className="animate-pulse-glow fill-current text-accent-tertiary motion-reduce:animate-none"
          style={{ animationDelay: "1.6s" }}
        />
        <circle
          cx="272"
          cy="64"
          r="4"
          className="animate-pulse-glow fill-current text-accent-warm motion-reduce:animate-none"
          style={{ animationDelay: "2.4s" }}
        />
      </svg>

      {/* ② 浮动代码片段小卡：普通 surface 卡 + float 错峰 */}
      <div className="animate-float absolute -top-2 right-0 z-20 rounded-card border border-default bg-surface px-4 py-3 font-mono text-xs shadow-card motion-reduce:animate-none">
        <p>
          <span className="text-accent-secondary">const</span>{" "}
          <span className="text-primary">agent</span> ={" "}
          <span className="text-accent-warm">await</span>{" "}
          <span className="text-accent-tertiary">runtime.spawn</span>
          <span className="text-secondary">()</span>
        </p>
      </div>

      {/* ④ 聊天气泡卡：一句中文问答 */}
      <div
        className="animate-float absolute bottom-0 left-0 z-20 flex w-56 flex-col gap-2 rounded-card border border-default bg-surface p-3 text-xs shadow-card motion-reduce:animate-none"
        style={{ animationDelay: "1.2s" }}
      >
        <p className="self-end rounded-card bg-accent px-3 py-1.5 text-inverse">
          今天的构建进度如何？
        </p>
        <p className="self-start rounded-card border border-default bg-surface px-3 py-1.5 text-secondary">
          三个 Agent 全部在线，一切正常。
        </p>
      </div>

      {/* ⑤ 状态面板小卡：ONLINE 胶囊 + 假 uptime 行 */}
      <div
        className="animate-float absolute -right-2 bottom-6 z-20 rounded-card border border-default bg-surface p-3 shadow-card motion-reduce:animate-none"
        style={{ animationDelay: "2.4s" }}
      >
        <StatusCapsule tone="success">ONLINE</StatusCapsule>
        <p className="mt-2 font-mono text-xs text-tertiary">
          uptime 99.98% · 42d
        </p>
      </div>
    </div>
  );
}
