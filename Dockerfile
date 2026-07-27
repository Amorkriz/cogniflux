# ---- 阶段 1：构建（pnpm build → build/client 全静态产物）----
FROM node:22-alpine AS builder
WORKDIR /app

# corepack 按 package.json 的 packageManager（pnpm@11.17.0）取用 pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable

# 依赖层缓存：先只拷贝清单文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# 再拷贝其余源码并构建
COPY . .
RUN pnpm build

# ---- 阶段 2：运行（nginx 托管纯静态文件）----
FROM nginx:alpine
COPY --from=builder /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
