# 多标签页功能实现文档

> 基于现有路由配置的多标签页（Tab）实现方案，支持页面缓存（keep-alive）与标签持久化（刷新恢复）

---

## 一、路由配置评估结论

### ✅ 当前路由配置可满足实现条件

| 能力               | 现状      | 说明                                                    |
| ------------------ | --------- | ------------------------------------------------------- |
| `handle.keepAlive` | ✅ 已定义 | RouteHandle 中已有 keepAlive 字段，可按路由控制是否缓存 |
| 路由元信息         | ✅ 完整   | title、breadcrumb 等可直接用于标签展示                  |
| 路由结构           | ✅ 支持   | 嵌套路由 + Outlet，便于在 AdminLayout 内替换渲染逻辑    |
| 菜单/面包屑        | ✅ 兼容   | 标签与菜单独立，不影响现有 buildMenuFromRoutes          |

### 无需修改路由配置即可实现

现有 `routeDefinitions`、`handle`、`mergeDefinitionsToRoutes` 结构均可复用，只需在 AdminLayout 层增加标签栏与缓存容器逻辑。

---

## 二、技术选型

### 2.1 页面缓存（Keep-Alive）

React 无内置 keep-alive，可选方案：

| 方案                   | 优点             | 缺点                |
| ---------------------- | ---------------- | ------------------- |
| **react-activation**   | API 成熟、维护中 | 需额外依赖          |
| **自实现 CacheOutlet** | 无依赖、可控     | 需处理路径→组件映射 |

**推荐**：使用 `react-activation`，与 React Router 配合简单，稳定可用。若项目使用 React 19 且 react-activation 存在兼容问题，可考虑自实现 CacheOutlet 或等待库更新。

> **React 19 兼容**：若 `react-activation` 与 React 19 存在兼容问题，可改用自实现 CacheOutlet（见附录）。

### 2.2 标签持久化

- 使用 `localStorage` 存储标签列表与当前激活项
- 与现有 Zustand persist 风格一致，可后续迁移到 Zustand

---

## 三、分步实现

### 步骤 1：安装依赖

```bash
pnpm add react-activation
```

### 步骤 2：创建标签 Store（支持持久化）

**文件**：`src/stores/tabStore.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TabItem {
  key: string;
  path: string;
  title: string;
  closable: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab: Omit<TabItem, 'closable'> & { closable?: boolean }) => void;
  removeTab: (key: string) => void;
  setActiveKey: (key: string) => void;
  closeOthers: (key: string) => void;
  closeAll: () => void;
}

const HOME_PATH = '/';
const HOME_TITLE = '仪表盘';

export const useTabStore = create<TabState>()(
  persist(
    (set, get) => ({
      tabs: [{ key: HOME_PATH, path: HOME_PATH, title: HOME_TITLE, closable: false }],
      activeKey: HOME_PATH,

      addTab: (tab) =>
        set((state) => {
          const exists = state.tabs.some((t) => t.key === tab.key);
          if (exists) return { activeKey: tab.key };
          const newTab: TabItem = {
            ...tab,
            closable: tab.closable ?? tab.key !== HOME_PATH,
          };
          return {
            tabs: [...state.tabs, newTab],
            activeKey: tab.key,
          };
        }),

      removeTab: (key) =>
        set((state) => {
          if (key === HOME_PATH) return state;
          const next = state.tabs.filter((t) => t.key !== key);
          const wasActive = state.activeKey === key;
          const idx = state.tabs.findIndex((t) => t.key === key);
          const nextActive = wasActive ? (next[Math.max(0, idx - 1)]?.key ?? HOME_PATH) : state.activeKey;
          return { tabs: next, activeKey: nextActive };
        }),

      setActiveKey: (key) => set({ activeKey: key }),

      closeOthers: (key) =>
        set((state) => ({
          tabs: state.tabs.filter((t) => t.key === key),
          activeKey: key,
        })),

      closeAll: () =>
        set({
          tabs: [{ key: HOME_PATH, path: HOME_PATH, title: HOME_TITLE, closable: false }],
          activeKey: HOME_PATH,
        }),
    }),
    { name: 'tab-storage' }
  )
);
```

### 步骤 3：获取当前路由元信息

使用 React Router 的 `useMatches()` 获取当前匹配路由的 `handle`（含 `title`、`keepAlive`），无需额外工具函数：

```ts
import { useMatches } from 'react-router-dom';
import type { RouteHandle } from '@/router/types';

interface MatchWithHandle {
  pathname: string;
  params: Record<string, string | undefined>;
  handle?: RouteHandle;
}

function useCurrentRouteMeta(): { title: string; keepAlive?: boolean } | null {
  const matches = useMatches() as MatchWithHandle[];
  const leaf = matches.findLast((m) => m.handle);
  if (!leaf?.handle) return null;
  const title =
    typeof leaf.handle.breadcrumb === 'function'
      ? leaf.handle.breadcrumb(leaf.params)
      : (leaf.handle.title ?? leaf.handle.breadcrumb ?? leaf.pathname);
  return { title, keepAlive: leaf.handle.keepAlive };
}
```

> 动态参数路由（如 `detail/:id`）的 breadcrumb 若为函数，需传入 `params` 生成标题。

### 步骤 4：AliveScope 与 KeepAlive 配置

**入口**：`src/main.tsx`

在根节点包一层 `AliveScope`（react-activation 要求）：

```tsx
import { AliveScope } from 'react-activation';

// ...
root.render(
  <StrictMode>
    <AliveScope>
      <App />
    </AliveScope>
  </StrictMode>
);
```

### 步骤 5：标签栏组件

**文件**：`src/components/TabBar/index.tsx`

```tsx
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs } from 'antd';
import type { TabsProps } from 'antd';
import { useTabStore } from '@/stores/tabStore';
import { useMemo } from 'react';

export function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeKey, removeTab, setActiveKey } = useTabStore();

  const items: TabsProps['items'] = useMemo(
    () =>
      tabs.map((tab) => ({
        key: tab.key,
        label: tab.title,
        closable: tab.closable,
        children: null,
      })),
    [tabs]
  );

  const onChange = (key: string) => {
    setActiveKey(key);
    navigate(key);
  };

  const onEdit = (targetKey: string, action: 'add' | 'remove') => {
    if (action === 'remove') {
      const idx = tabs.findIndex((t) => t.key === targetKey);
      const goTo = tabs[idx - 1] ?? tabs[idx + 1];
      removeTab(targetKey);
      if (goTo) navigate(goTo.key);
    }
  };

  if (tabs.length <= 1) return null;

  return (
    <Tabs
      type="editable-card"
      hideAdd
      size="small"
      activeKey={activeKey}
      items={items}
      onChange={onChange}
      onEdit={onEdit}
      className="tab-bar"
    />
  );
}
```

### 步骤 6：集成 KeepAlive 与 Tab 逻辑到 AdminLayout

**核心思路**：用 `KeepAlive` 包裹 `Outlet`，用 pathname 作为缓存 key；在导航时通过 `useCurrentRouteMeta` 同步更新 tabStore。

**文件**：`src/components/layout/AdminLayout/index.tsx`（关键变更）

```tsx
import { KeepAlive } from 'react-activation';
import { useTabStore } from '@/stores/tabStore';
import { TabBar } from '@/components/TabBar';
import { useCurrentRouteMeta } from '@/router/hooks/useCurrentRouteMeta';

// 在 AdminLayout 内：

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || '/';
  const meta = useCurrentRouteMeta();
  const addTab = useTabStore((s) => s.addTab);
  const setActiveKey = useTabStore((s) => s.setActiveKey);

  // 路由变化时同步 tab（meta 来自 useMatches，与当前 pathname 对应）
  useEffect(() => {
    if (pathname === '/login' || pathname === '*' || !meta) return;
    addTab({ key: pathname, path: pathname, title: meta.title, closable: pathname !== '/' });
    setActiveKey(pathname);
  }, [pathname, meta?.title, addTab, setActiveKey]);

  return (
    <Layout className={styles.root}>
      {/* ... Sider、Header ... */}
      <Layout.Header>
        {/* ... */}
        <TabBar />
      </Layout.Header>
      <Layout.Content className={styles.content} data-scroll-container>
        {/* 仅对 keepAlive 路由做缓存；其他路由直接 Outlet */}
        {meta?.keepAlive ? (
          <KeepAlive cacheKey={pathname} name={pathname} saveScrollPosition="screen">
            <AnimatedOutlet />
          </KeepAlive>
        ) : (
          <AnimatedOutlet />
        )}
      </Layout.Content>
    </Layout>
  );
};
```

> `saveScrollPosition="screen"` 可在 react-activation 中恢复滚动位置，与 `data-scroll-container` 配合。

### 步骤 7：菜单点击时打开新标签

菜单点击不再直接 `navigate`，而是先 `addTab` 再 `navigate`，或由 `useEffect` 在 pathname 变化时自动 `addTab`（如上）。若希望「点击菜单 = 打开新 tab」，可在 `handleMenuClick` 中调用 `addTab` 后再 `navigate`。

### 步骤 8：刷新后恢复

Store 已使用 `persist`，刷新后 `tabs` 与 `activeKey` 会从 localStorage 恢复。需要在应用初始化时做一次「当前 path 与 activeKey 对齐」：

**可选**：在 `Router` 或 `AdminLayout` 的 `useEffect` 中，当从持久化恢复时，若 `location.pathname` 与 `activeKey` 不一致，执行一次 `navigate(activeKey)` 或 `setActiveKey(location.pathname)`，视产品预期选择其一。

---

## 四、注意事项

### 4.1 keepAlive 与 404 / 特殊路由

- `path: '*'`（404）、`/login` 等不建议加入 tab 列表。
- `addTab` 前可用白名单过滤：仅当 pathname 对应「可 tab 化」的路由时才 `addTab`。

### 4.2 动态路由参数（如 `/images/detail/:id`）

- `key` 使用 `pathname`（如 `/images/detail/123`），保证同一资源一个标签。
- 标题可用 `handle.breadcrumb` 函数 + `useParams()` 动态生成，再写入 `TabItem.title`。

### 4.3 与路由动画的配合

- `AnimatedOutlet` 在 `KeepAlive` 内部时，切换 tab 会触发进入/退出动画。
- 若动画与缓存表现冲突，可对 `keepAlive` 路由关闭动画：在 `handle.animation` 中根据 `keepAlive` 设为 `type: 'none'`。

### 4.4 性能

- 仅对 `handle.keepAlive: true` 的路由使用 `KeepAlive`，避免缓存过多页导致内存上升。

### 4.5 持久化校验

- 刷新后，持久化的 path 可能已失效（权限变更、路由调整）。
- 建议在恢复 tabs 时，用当前 `routeDefinitions` 校验 path 是否仍存在；无效则从列表中移除。

---

## 五、可选增强

| 功能       | 实现思路                                                             |
| ---------- | -------------------------------------------------------------------- |
| 右键菜单   | 使用 Ant Design Dropdown，“关闭其他”“关闭所有”调用 tabStore          |
| 双击关闭   | Tab 的 `onEdit` 已在 `action === 'remove'` 时处理                    |
| 最大标签数 | 在 `addTab` 中限制 `tabs.length`，超出时移除最久未访问               |
| 刷新当前   | `navigate(pathname, { replace: true })` 或对当前 key 做 remount 处理 |

---

## 六、目录结构建议

```
src/
├── stores/
│   └── tabStore.ts
├── router/
│   └── hooks/
│       └── useCurrentRouteMeta.ts  (基于 useMatches 封装)
├── components/
│   ├── TabBar/
│   │   └── index.tsx
│   └── layout/
│       └── adminLayout/
│           └── index.tsx  (集成 TabBar + KeepAlive)
```

---

_文档版本：v1.0 | 基于现有路由配置评估_
