# 《改命 · Startup Graveyard》Next.js 版
# 构建上下文为仓库根目录；应用代码在 web/

FROM node:20-alpine AS deps
WORKDIR /app
COPY web/package.json web/package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY web/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
# Render 会注入 PORT（默认 10000），next start 自动读取
EXPOSE 3000
CMD ["npm", "start"]
