# Cogniflux 发布前检查清单

> 每次发版（新页面/新内容/样式改动）前过一遍。五条命令全绿是底线，其余按改动范围抽查。

## 0. 五条命令全绿（必须）

```bash
pnpm typecheck        # 路由类型生成 + TS 严格检查
pnpm lint             # ESLint（含目录依赖方向规则）
pnpm validate-content # 内容 frontmatter Zod 校验
pnpm test             # Vitest 单测
pnpm build            # 生产构建（prerender + generate-seo）
```

CI（`.github/workflows/ci.yml`）会跑同一套；本地先跑省一轮往返。

## 1. Lighthouse 抽查

- [ ] 抽查 Home + 一篇文章详情页（移动端模拟）。
- [ ] 性能预算：首页 JS ≤180KB gzip、LCP ≤2.0s（4G）、CLS <0.1、INP <200ms。
- [ ] SEO 分 ≥95。

## 2. 移动端真机走查

- [ ] 新增/改动页面在真机过一遍（不是只看 DevTools 模拟）。
- [ ] 抽屉导航可用；触控目标 ≥44×44px；hover 效果有 `:active` 触屏替代。
- [ ] 正文字号 ≥16px（防 iOS 自动缩放）；列表页每屏 1–2 张卡片不拥挤。

## 3. OG / meta 验证

- [ ] 用 OG 调试器（如 opengraph.xyz、X Card Validator）验证新页面的 title/description/OG 图。
- [ ] canonical 正确；文章页用封面图，无封面回退 `og-default.png`。
- [ ] `build/client/sitemap.xml`、`feed.xml` 包含新发布内容（draft 不得出现）。

## 4. reduced-motion 走查

- [ ] 系统开启"减弱动态效果"后走查：入场动效直接呈现、呼吸点/覆盖层动画关闭、页面无跳变。
- [ ] 新增动效确认只动 `transform/opacity`，且时长/缓动来自动效令牌。

## 5. 坏 frontmatter 自检

- [ ] `pnpm validate-content` 通过（CI 也会跑）。
- [ ] 新内容 slug 与目录/文件名一致，全站唯一，发布后不再改。
- [ ] `status` 正确：要发布的是 `published`（draft 不进生产构建）。
- [ ] `cover.alt` 已填；`related` 引用的 kind+slug 真实存在（悬空引用会被静默跳过，注意确认渲染结果）。

## 6. 无障碍抽查（改动交互组件时）

- [ ] Tab 键全流程可达，焦点环可见（统一 `--color-focus-ring`）。
- [ ] 每页唯一 h1 且标题层级不跳；图片有 alt。
- [ ] 新语义色组合满足 WCAG AA（正文 4.5:1）。
