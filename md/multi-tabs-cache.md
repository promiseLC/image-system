# 缓存多标签页使用说明

本文档说明本项目中多标签页（Tab）与页面缓存的实现、用法及注意事项。

---

## 一、功能概览

| 能力         | 说明                                               |
| ------------ | -------------------------------------------------- |
| **多标签页** | 点击菜单/用户下拉打开新 tab，支持关闭、切换        |
| **页面缓存** | 按路由配置缓存页面状态，切换 tab 不重新加载        |
| **路由动画** | 与 View Transitions 兼容，支持淡入淡出、滑动等效果 |
| **持久化**   | tabs 与激活 tab 持久化到 localStorage，刷新可恢复  |

---

## 二、快速用法

### 2.1 打开新标签

- **侧边栏菜单**：点击任意菜单项 → 新增/激活对应 tab
- **用户下拉**：点击「个人中心」→ 新增/激活对应 tab
- **Tab 栏**：点击已有 tab → 切换至该页

### 2.2 关闭标签

- **点击 ×**：关闭当前 tab，自动切换到相邻 tab
- **右键菜单**：右键 tab 可执行：
  - 刷新：重新加载当前页并清缓存
  - 关闭其他：仅保留当前 tab 和首页
  - 关闭左侧 / 关闭右侧：批量关闭
  - 关闭全部：回到首页（首页 `/` 不可关闭）

### 2.3 配置某路由启用缓存

在 `routeDefinitions` 的 `handle` 中设置：

```ts
handle: {
  breadcrumb: '图片列表',
  keepAlive: true,  // 开启该页缓存
  // ...
}
```

`keepAlive: true` 的路由在 tab 切换时会保留状态，不会被卸载。

---

## 三、核心实现

### 3.1 架构示意

```
RootLayout (Router 内)
├── AliveScope          ← react-activation 根容器
├── NavigationProgress
└── Outlet
    └── AdminLayout
        ├── TabBar      ← 标签栏
        └── Content
            ├── KeepAlive (meta.keepAlive 为 true 时)
            │   └── AnimatedOutlet  ← 动画 + 缓存
            └── AnimatedOutlet      ← 仅动画，不缓存
```

### 3.2 关键文件

| 文件                                      | 作用                                                |
| ----------------------------------------- | --------------------------------------------------- |
| `src/stores/tabStore.ts`                  | 标签数据与操作（addTab、removeTab、closeOthers 等） |
| `src/components/TabBar/`                  | 标签栏 UI、右键菜单                                 |
| `src/components/layout/AdminLayout/`      | 布局、KeepAlive 与 AnimatedOutlet 接入              |
| `src/components/layout/RootLayout/`       | AliveScope 挂载                                     |
| `src/router/hooks/useCurrentRouteMeta.ts` | 获取当前路由的 title、keepAlive、breadcrumb         |

---

## 四、缓存与路由动画兼容

### 4.1 兼容原理

- **KeepAlive**：用 `react-activation` 的 `KeepAlive` 包裹 `Outlet` 的子内容
- **AnimatedOutlet**：在外层或内部设置 `view-transition-name: page-main`，配合 View Transitions API 做动画
- **组合方式**：`KeepAlive` 内渲染 `<AnimatedOutlet>{outlet}</AnimatedOutlet>`，同时保留缓存和动画

```tsx
{
  meta?.keepAlive && outlet ? (
    <KeepAlive cacheKey={pathname} name={pathname} autoFreeze={false}>
      <AnimatedOutlet>{outlet}</AnimatedOutlet>
    </KeepAlive>
  ) : (
    <AnimatedOutlet />
  );
}
```

### 4.2 注意事项

1. **AliveScope** 必须在 `Router` 内部，否则缓存的页面无法正常使用 `useLocation`、`useParams` 等
2. **React 19 + createRoot**：需设置 `KeepAlive` 的 `autoFreeze={false}`，并避免使用 `StrictMode`
3. **刷新缓存**：右键 tab 选择「刷新」，会通过 `useAliveController().refresh(name)` 重新挂载该页

---

## 五、缓存组件兼容

### 5.1 react-activation 要求

- 根节点挂载 `AliveScope`（通常放在 RootLayout）
- 每个需要缓存的 `<KeepAlive>` 需唯一 `cacheKey` 和 `name`（本项目用 `pathname`）

### 5.2 被缓存页面的 hooks

缓存的页面仍然在 React 树中，可正常使用：

- `useLocation`
- `useParams`
- `useSearchParams`
- 普通 `useState`、`useEffect` 等

离开 tab 时组件不会卸载，状态会保留；再次切回时不会重新挂载。

### 5.3 手动控制缓存

如需在代码中刷新或清除缓存：

```ts
import { useAliveController } from 'react-activation';

const { refresh, dropScope } = useAliveController();

// 刷新当前页
refresh(pathname);

// 清除某页缓存（需在非激活状态下）
dropScope(pathname);
```

---

## 六、路由动画兼容

### 6.1 与多标签页的配合

- 路由的 `handle.animation` 控制 AnimatedOutlet 的动画类型（fade、slide-left、slide-right、zoom）
- 多标签页的切换本质是路由变化，动画照常触发
- KeepAlive 只决定是否卸载组件，不影响 View Transitions 的「旧页/新页」动画

### 6.2 动画类型

| 类型          | 效果         |
| ------------- | ------------ |
| `fade`        | 淡入淡出     |
| `slide-left`  | 新页从左滑入 |
| `slide-right` | 新页从右滑入 |
| `zoom`        | 缩放过渡     |
| `none`        | 无动画       |

---

## 七、常见问题

**Q：首页为什么不能关闭？**  
A：首页 `/` 作为默认 tab，`closable` 为 `false`，设计上不可关闭。

**Q：刷新 tab 后列表/表单会重置吗？**  
A：使用「刷新」会清掉该页缓存并重新挂载，状态会重置；正常切换 tab 则不会。

**Q：如何限制哪些路由可被缓存？**  
A：在 `routeDefinitions` 的 `handle.keepAlive` 中按需设置，仅 `true` 的路由会被 KeepAlive 包裹。

**Q：StrictMode 为什么不能开？**  
A：`react-activation` 与 React StrictMode 存在兼容问题，如需启用需评估或考虑自实现缓存方案。

---

## 八、相关文档

- 详细实现说明：`docs/multi-tabs-implementation.md`
- 路由动画设计：`docs/route-animation-design.md`
- 路由配置：`src/router/routeDefinitions.tsx`
