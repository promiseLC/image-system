# API 客户端与数据缓存设计

**日期**: 2025-03-18  
**状态**: 已批准  
**范围**: Phase A — 打通请求层、TanStack Query、MSW Mock

---

## 1. 概述

### 1.1 目标

- 实现请求库与数据缓存，支持登录、当前用户、图片列表三类接口
- 使用 TanStack Query + Axios + MSW
- 开发阶段用 MSW 模拟，切换真实 API 时无需改动业务代码

### 1.2 响应格式约定

- **HTTP 200**：解析 `{ code, data, message }`，`code === 0` 为成功，其余为业务错误
- **HTTP 5xx**：直接走错误分支，不解析业务 code，统一 throw
- **登录成功**：token 从响应头 `Authorization: Bearer <token>` 获取，不再从 body 返回

### 1.3 错误与 data 安全

- 所有错误路径在拦截器内 throw，不向页面返回异常 data
- 页面按 `isPending` → `isError` → `data` 顺序处理，保证成功分支 `data` 有值

---

## 2. 架构与目录结构

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────┐
│  React 组件 (pages/hooks)                                    │
│  useQuery / useMutation ← TanStack Query                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  API 层 (apis/auth.ts, apis/user.ts, apis/images.ts)        │
│  纯函数，调用 apiClient.get/post，返回 Promise<T>             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  apiClient (apis/client.ts)                                  │
│  Axios 实例 + 请求/响应拦截器                                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │  dev: MSW 拦截                        │  prod: 真实后端
        └───────────────────────────────────────┘
```

### 2.2 目录结构

```
src/
├── apis/
│   ├── client.ts          # Axios 实例 + 拦截器
│   ├── types.ts           # ApiResponse<T>
│   ├── auth.ts
│   ├── user.ts
│   └── images.ts
├── mocks/
│   ├── browser.ts
│   ├── handlers/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── images.ts
│   └── index.ts
├── lib/
│   └── queryClient.ts
├── main.tsx
└── ...
```

---

## 3. Axios Client 与拦截器

### 3.1 通用类型

```ts
interface ApiResponse<T = unknown> {
  code: number;
  data: T;
  message: string;
}
```

### 3.2 请求拦截器

| 步骤 | 行为                                                         |
| ---- | ------------------------------------------------------------ |
| 1    | 注入 baseURL（`VITE_API_BASE_URL`，默认 `/api`）             |
| 2    | 注入 `Content-Type: application/json`                        |
| 3    | 若 authStore 有 token，注入 `Authorization: Bearer ${token}` |
| 4    | 传递 signal（支持请求取消）                                  |

### 3.3 响应拦截器

| 场景     | 处理逻辑                                                                      |
| -------- | ----------------------------------------------------------------------------- |
| HTTP 2xx | 解析 `{ code, data, message }`；`code === 0` 返回 `data`，否则 throw 业务错误 |
| HTTP 401 | 清空 token、authStore.logout()、跳转登录、throw                               |
| HTTP 403 | throw 权限错误                                                                |
| HTTP 5xx | 直接 throw，不解析 body                                                       |

### 3.4 其他配置

- timeout: 10s
- 支持 config.silent 关闭统一错误提示（Phase B 实现）

---

## 4. TanStack Query 配置

### 4.1 queryClient 配置

| 配置项             | 值       |
| ------------------ | -------- |
| queries.staleTime  | 60000    |
| queries.retry      | 1        |
| queries.retryDelay | 指数退避 |
| mutations.retry    | 0        |

### 4.2 集成

- main.tsx 包裹 `QueryClientProvider`
- queryFn 传入 signal 给 apiClient

---

## 5. MSW Mock

### 5.1 启动

- 仅在 `import.meta.env.DEV` 时启动
- main.tsx 顶层 await 就绪后再 render

### 5.2 接口约定

| 接口     | 方法 | path            |
| -------- | ---- | --------------- |
| 登录     | POST | /api/auth/login |
| 当前用户 | GET  | /api/user/me    |
| 图片列表 | GET  | /api/images     |

### 5.3 登录

- 请求体：`{ username, password }`
- 成功：响应头 `Authorization: Bearer <token>`，body `{ code: 0, data: { user } }`
- Mock：admin/123456 通过

### 5.4 其他

- 图片列表返回约 10 条假数据
- Phase A 不模拟 500

---

## 6. API 层与页面集成

### 6.1 API 函数

| 文件           | 函数                  |
| -------------- | --------------------- |
| apis/auth.ts   | login(params)         |
| apis/user.ts   | getCurrentUser()      |
| apis/images.ts | getImageList(params?) |

### 6.2 queryKey

- 当前用户：`['user', 'me']`
- 图片列表：`['images', { page, pageSize }]`

### 6.3 页面改造

| 页面       | 改动                                                      |
| ---------- | --------------------------------------------------------- |
| login      | useMutation(login)，成功后从响应头取 token 写入 authStore |
| 需用户信息 | useQuery(['user', 'me'], getCurrentUser)                  |
| images     | useQuery(['images', params], getImageList)                |

---

## 7. 环境变量与依赖

### 7.1 环境变量

```
VITE_API_BASE_URL=/api
```

### 7.2 Phase A 依赖

- axios
- @tanstack/react-query
- msw

---

## 8. 后续规划（B/C 阶段）

- 统一错误提示（message.error）
- 401 自动登出与跳转
- 并行限制、请求取消细化
- 可选：@tanstack/react-query-devtools
