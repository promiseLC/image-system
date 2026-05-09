# Axios + React Query 使用说明（本项目）

## 1. 这两个组件各自解决什么问题

### Axios：HTTP 请求与拦截器

在本项目里，Axios 主要负责：

- 发起 HTTP 请求（统一 `baseURL`、`timeout`、默认请求头）
- 请求拦截器：从 `authStore` 自动注入 token（除非显式 `skipAuth`）
- 响应拦截器：统一处理接口响应约定 `{ code, data, message }`
- 统一错误提示/重定向（如 HTTP 401 跳转登录）

相关文件：

- `src/apis/client.ts`

### React Query（TanStack Query）：数据缓存与请求状态

React Query 主要负责：

- 缓存与去重（同一个 `queryKey` 在一段时间内不重复请求）
- 管理加载态/错误态（`isPending`、`isError`、`error` 等）
- 在组件卸载/查询作废时取消请求（通过 `queryFn` 的 `signal`）

相关文件：

- `src/lib/queryClient.ts`
- `src/main.tsx`（`QueryClientProvider`）

---

## 2. 本项目的核心配置逻辑

### 2.1 `axios` 基础配置（`src/apis/client.ts`）

1. `baseURL` 来自环境变量

- `import.meta.env.VITE_API_BASE_URL ?? '/api'`

2. 请求拦截器自动注入 token

- 默认行为：如果 `authStore.token` 存在，会注入：
  - `Authorization: Bearer <token>`
- 如果该请求不需要 token（例如登录），调用时传：
  - `skipAuth: true`

3. 响应拦截器按约定解包
   本项目假定后端返回：

- HTTP 200：`{ code, data, message }`
  - `code === 0`：成功，返回最终 `data`
  - `code !== 0`：构造业务错误并 reject（可配置 `silent` 控制是否弹 message）
- HTTP 5xx：无条件弹出错误提示并 reject（不依赖业务 `code`）

4. 登录取 token 的特殊需求：`withHeaders`
   部分接口需要从响应头读取 token（而不是 body）。
   因此支持：

- `withHeaders: true`：成功时返回 `{ data, headers }`

---

### 2.2 `QueryClient` 默认策略（`src/lib/queryClient.ts`）

本项目设置了这些默认项：

- `queries.staleTime = 60000`
  - 1 分钟内认为数据“新鲜”，避免重复请求
- `queries.retry = 1`
  - 失败最多重试 1 次
- `queries.retryDelay = 指数退避`（上限 10s）
- `mutations.retry = 0`
  - mutation 不自动重试，避免重复提交

并在 `src/main.tsx` 用 `QueryClientProvider` 挂载到应用根：

- 所有页面/组件都可以使用 `useQuery / useMutation`

---

## 3. 本项目的使用案例

### 3.1 登录页：`useMutation` 调用 `login`

相关：

- `src/pages/login/index.tsx`
- `src/apis/auth.ts`

流程：

1. `useMutation({ mutationFn: login })` 提交表单
2. `login()` 在成功时：
   - 从响应头读取 `Authorization: Bearer <token>`
   - 从 body 的 `data.user` 得到用户信息
3. `onSuccess` 中：
   - 调用 `authStore.login(token, roles, permissions)`
   - 写入 `queryClient.setQueryData(['user','me'], user)`（让用户信息立刻可用）
4. 跳转 `from` 参数页

---

### 3.2 管理布局：用 `useQuery` 拉取当前用户信息

相关：

- `src/components/layout/AdminLayout/index.tsx`
- `src/apis/user.ts`

使用方式：

- `useQuery({ queryKey: ['user','me'], queryFn: getCurrentUser, enabled: isAuthenticated && !!token })`

要点：

- `enabled` 用于避免未登录时请求 `/user/me`
- 接口状态在布局中显示（例如按钮显示“加载中…/用户名”）

---

### 3.3 图片列表页：`useQuery` + 局部 loading/error

相关：

- `src/pages/images/index.tsx`
- `src/apis/images.ts`

使用方式：

- `useQuery({ queryKey: ['images', { page, pageSize }], queryFn: ({ signal }) => getImageList(...,{signal}) })`

显示逻辑（符合你在文档中要求的“loading 不全屏替换”）：

- `isPending`：只在内容区显示 `Spin`/Skeleton
- `isError`：只在内容区显示 `Alert` + `重试按钮`
- 成功：渲染图片列表网格

---

## 4. 取消请求（请求取消）是如何接入的

TanStack Query 会把 `signal` 传给 `queryFn`：

- `queryFn: ({ signal }) => api.get(..., { signal })`

本项目的做法是：

- 在 `src/apis/user.ts / src/apis/images.ts` 里把 `signal` 原样透传给 Axios

因此当查询作废（组件卸载/参数变化）时，Axios 会中止请求。

---

## 5. 常见配置项速查

### Axios 侧（`src/apis/client.ts`）

- `skipAuth: true`：该请求不要自动注入 token（登录用）
- `silent: true`：业务错误（`code !== 0`）不弹 message（HTTP 5xx 不受影响）
- `withHeaders: true`：成功返回 `{ data, headers }`（登录用）

### React Query 侧（`src/lib/queryClient.ts` + hooks）

- `queryKey`：决定缓存与去重的粒度
- `enabled`：控制是否发请求
- `isPending/isError`：驱动局部 UI（不全屏替换）

---

## 6. 调试建议

1. 确认 MSW 是否启用

- `src/main.tsx` 在 `import.meta.env.DEV` 时启动 worker

2. 使用 DevTools 查看请求是否命中 `/api/*`
3. 如果用户登录后仍请求 `/user/me` 失败：

- 检查 token 是否写入 `authStore`（以及 `Authorization: Bearer ...` 是否注入成功）
