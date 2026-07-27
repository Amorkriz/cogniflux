import { useState } from "react";

import type { Route } from "./+types/index";
import { PageHero } from "@/shared/components";
import { Collapse, FadeIn, SlideUp, Stagger } from "@/shared/motion";
import {
  Badge,
  Button,
  Card,
  ChevronDown,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Inbox,
  Info,
  Input,
  Search,
  Separator,
  Skeleton,
  StatusCapsule,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tag,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "UI 陈列室 · Cogniflux" },
    { name: "robots", content: "noindex" },
  ];
}

/** 语义色令牌（读 CSS 变量渲染色板） */
const colorTokens = [
  "--bg-base",
  "--bg-surface",
  "--bg-raised",
  "--text-primary",
  "--text-secondary",
  "--text-tertiary",
  "--text-inverse",
  "--border-default",
  "--border-strong",
  "--accent",
  "--accent-hover",
  "--success",
  "--warning",
  "--danger",
  "--info",
  "--color-focus-ring",
  "--overlay-scrim",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-section first:mt-block">
      <h2 className="text-xl font-semibold text-primary">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** /dev/ui：shared/ui 组件、motion primitives 与令牌色板的内部陈列页（不进 sitemap） */
export default function DevUi() {
  const [collapseOpen, setCollapseOpen] = useState(false);

  return (
    <div className="mx-auto max-w-page px-4 py-section sm:px-6">
      <PageHero
        eyebrow="dev/ui"
        title="UI 陈列室"
        description="shared/ui 组件各状态、motion primitives 与语义令牌色板。内部页面，不进 sitemap。"
      />

      <Section title="令牌色板（语义层）">
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colorTokens.map((token) => (
            <li
              key={token}
              className="overflow-hidden rounded-card border border-default bg-surface"
            >
              <div
                className="h-14 border-b border-default"
                style={{ backgroundColor: `var(${token})` }}
              />
              <p className="px-3 py-2 font-mono text-xs text-secondary">{token}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="lg">Large</Button>
          <Button size="icon" variant="ghost" aria-label="搜索">
            <Search aria-hidden="true" />
          </Button>
        </div>
      </Section>

      <Section title="Card">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm text-secondary">默认卡片（border，无阴影）</p>
          </Card>
          <Card elevated>
            <p className="text-sm text-secondary">elevated：shadow-card</p>
          </Card>
          <Card interactive elevated>
            <p className="text-sm text-secondary">
              interactive：hover 微抬升（纯 CSS，reduced-motion 取消）
            </p>
          </Card>
          <Card glass>
            <p className="text-sm text-secondary">
              glass：毛玻璃（backdrop-filter，旧设备 @supports 降级纯色）
            </p>
          </Card>
          <Card glowBorder>
            <p className="text-sm text-secondary">
              glowBorder：hover/focus-within 渐变流光描边（只动 opacity）
            </p>
          </Card>
          <Card glass glowBorder interactive>
            <p className="text-sm text-secondary">
              glass + glowBorder + interactive 叠加
            </p>
          </Card>
        </div>
      </Section>

      <Section title="StatusCapsule（游戏化状态胶囊·非领域状态，领域状态用 Badge/Tag）">
        <div className="flex flex-wrap items-center gap-2">
          <StatusCapsule>accent</StatusCapsule>
          <StatusCapsule tone="secondary">secondary</StatusCapsule>
          <StatusCapsule tone="tertiary">tertiary</StatusCapsule>
          <StatusCapsule tone="warm">warm</StatusCapsule>
          <StatusCapsule tone="pink">pink</StatusCapsule>
          <StatusCapsule tone="success">online</StatusCapsule>
          <StatusCapsule tone="warning">building</StatusCapsule>
          <StatusCapsule tone="neutral">archived</StatusCapsule>
          <StatusCapsule tone="success" animated={false}>
            静态点 animated=false
          </StatusCapsule>
        </div>
      </Section>

      <Section title="Badge / Tag">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>neutral</Badge>
          <Badge variant="accent">accent</Badge>
          <Badge variant="outline">outline</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="danger">danger</Badge>
          <Badge variant="info">info</Badge>
          <Tag>#react</Tag>
          <Tag>#agents</Tag>
          <Tag>#design-tokens</Tag>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid max-w-md gap-3">
          <Input placeholder="默认输入框" aria-label="示例输入框" />
          <Input placeholder="禁用态" aria-label="禁用输入框" disabled />
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="grid max-w-md gap-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full rounded-card" />
        </div>
      </Section>

      <Section title="EmptyState">
        <EmptyState
          icon={<Inbox />}
          title="这里什么都没有"
          description="EmptyState 组件：图标 + 标题 + 描述 + 行动区插槽。"
          action={<Button variant="secondary">去首页看看</Button>}
        />
      </Section>

      <Section title="Separator">
        <div className="max-w-md">
          <p className="text-sm text-secondary">水平分隔线</p>
          <Separator className="my-4" />
          <div className="flex h-6 items-center gap-4 text-sm text-secondary">
            <span>左</span>
            <Separator orientation="vertical" />
            <span>右</span>
          </div>
        </div>
      </Section>

      <Section title="Dialog（Radix：焦点圈闭 / Esc / 滚动锁定）">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">打开 Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>示例对话框</DialogTitle>
              <DialogDescription>
                样式全部来自语义令牌；Tab 焦点被圈闭在对话框内，Esc 可关闭。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="secondary">次要操作</Button>
              <Button>确认</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Tabs（方向键切换）">
        <Tabs defaultValue="one">
          <TabsList>
            <TabsTrigger value="one">面板一</TabsTrigger>
            <TabsTrigger value="two">面板二</TabsTrigger>
            <TabsTrigger value="three" disabled>
              禁用
            </TabsTrigger>
          </TabsList>
          <TabsContent value="one">
            <Card padding="sm">
              <p className="text-sm text-secondary">第一个面板的内容。</p>
            </Card>
          </TabsContent>
          <TabsContent value="two">
            <Card padding="sm">
              <p className="text-sm text-secondary">第二个面板的内容。</p>
            </Card>
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Tooltip（hover / focus 触发）">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="说明">
              <Info aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>反色气泡，随主题翻转。</TooltipContent>
        </Tooltip>
      </Section>

      <Section title="Motion primitives">
        <div className="grid gap-4 sm:grid-cols-2">
          <FadeIn inView>
            <Card padding="sm">
              <p className="font-mono text-xs text-tertiary">FadeIn (inView)</p>
              <p className="mt-1 text-sm text-secondary">滚动进入视口时淡入，一次性。</p>
            </Card>
          </FadeIn>
          <SlideUp inView>
            <Card padding="sm">
              <p className="font-mono text-xs text-tertiary">SlideUp (inView)</p>
              <p className="mt-1 text-sm text-secondary">淡入 + 上移 8px。</p>
            </Card>
          </SlideUp>
        </div>

        <p className="mt-8 font-mono text-xs text-tertiary">
          Stagger（14 项：前 12 项逐项入场，之后立即显示）
        </p>
        <Stagger className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-7">
          {Array.from({ length: 14 }, (_, i) => (
            <Card key={i} padding="sm" className="text-center">
              <span className="font-mono text-sm text-secondary">{i + 1}</span>
            </Card>
          ))}
        </Stagger>

        <div className="mt-8 max-w-md">
          <Button
            variant="secondary"
            onClick={() => setCollapseOpen((v) => !v)}
            aria-expanded={collapseOpen}
          >
            Collapse 展开/收起
            <ChevronDown
              aria-hidden="true"
              className={
                collapseOpen
                  ? "rotate-180 transition-transform duration-(--motion-base) motion-reduce:transition-none"
                  : "transition-transform duration-(--motion-base) motion-reduce:transition-none"
              }
            />
          </Button>
          <Collapse open={collapseOpen} className="mt-3">
            <Card padding="sm">
              <p className="text-sm text-secondary">
                Collapse primitive：height + opacity 过渡；reduced-motion 时直接挂载/卸载。
              </p>
            </Card>
          </Collapse>
        </div>

        <p className="mt-8 text-sm text-secondary">
          PageTransition：切换任意路由即可看到 150ms 仅 opacity 的页面过渡（已在应用壳生效）。
        </p>
      </Section>
    </div>
  );
}
