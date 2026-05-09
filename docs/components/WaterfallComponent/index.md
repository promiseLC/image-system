# 从 0 实现一个瀑布流组件(Waterfall / Masonry)

> 面向 React + TypeScript 初学者的实战教程。实现一个类似小红书 / Pinterest 风格的图文瀑布流:**列数随容器宽度自适应**、**每张图片高度不同**、**集成 `LazyImage` 做图片懒加载**。
>
> 前置阅读:[从 0 实现一个懒加载组件](../LazyLoadComponent/index.md) — 本文会直接使用其中的 `LazyImage`。

---

## 一、什么是瀑布流

### 1.1 核心概念一句话

> 列数固定、**每列项目高度不同**、新项目永远放进"当前最短的那一列",让视觉上自然错落、高度平衡。

### 1.2 目标效果

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│  img   │ │  img   │ │  img   │ │        │
│        │ │        │ │        │ │  img   │
│        │ └────────┘ │        │ │        │
│        │  标题/描述  │        │ │        │
│        │  作者 · ♥  │        │ │        │
└────────┘ ┌────────┐ └────────┘ │        │
 标题/描述  │  img   │  标题/描述  │        │
 作者 · ♥   │        │  作者 · ♥   └────────┘
```

特点:

- 列宽相同,**高度由内容(主要是图片宽高比)决定**
- 新 item 总是被放进"当前最短的列"
- 列数跟容器宽度走(例如宽屏 5 列、窄屏 2 列)
- 滚动时图片才发起请求(懒加载)

### 1.3 什么时候该上瀑布流?

| 场景                                | 是否适合瀑布流 |
| ----------------------------------- | :------------: |
| 商品列表、每项大小一致              |       ❌       |
| 图文 Feed,图片比例参差不齐          |       ✅       |
| 图片画廊 / 壁纸站 / Pinterest 式 UI |       ✅       |
| 强调"浏览+发现"体验的 UGC 社区      |       ✅       |

### 1.4 为什么不能用普通 Grid / Flex?

| 方案                      | 能做瀑布流吗?     | 问题                                                                           |
| ------------------------- | ----------------- | ------------------------------------------------------------------------------ |
| `display: grid`           | ⚠️ 只能做定高网格 | 行高统一,高矮不一的卡片会留大空白                                              |
| `display: flex` + wrap    | ❌                | flex 是"行级"布局,换行后整行对齐,无法错落                                      |
| `column-count` (CSS 多栏) | ⚠️ 简单场景可用   | item 从上往下填每列,**阅读顺序是 "↓↓↓ ↓↓↓"**,不是 "→→→ →→→",配合分页加载会错乱 |
| **JS 计算 + 绝对定位**    | ✅ 本文方案       | 需要图片宽高,但可控、顺序正确、性能好                                          |

---

## 二、实现思路

### 2.1 整体原理

```
读取容器宽度 (ResizeObserver)
         ↓
根据 columnWidth 反推"列数 + 实际列宽"
         ↓
遍历 items,每个 item 按宽高比算出"卡片高度"
         ↓
选"当前最短的列" → 记录 top / left → 列高度累加
         ↓
每个 item position: absolute 渲染到计算位置
```

### 2.2 关键要素

| 要素                  | 含义                         | 来源                       |
| --------------------- | ---------------------------- | -------------------------- |
| `containerWidth`      | 容器宽度                     | `ResizeObserver`           |
| `columns`             | 列数                         | 容器宽度 / 目标列宽 算出来 |
| `actualColumnWidth`   | 实际列宽(消除右边白边)       | 容器宽度反推               |
| `item.width / height` | 图片原始宽高(用来算等比高度) | 接口返回                   |
| `columnHeights`       | 每列当前累计高度             | 布局算法内部维护           |
| `top / left`          | 每个 item 的绝对定位         | 布局算法输出               |

### 2.3 "最短列优先"算法图解

3 列,`columnHeights = [0, 0, 0]`:

```
放 item 1(高 300): 选第 0 列 → 列高 [312, 0, 0]
放 item 2(高 200): 选第 1 列 → 列高 [312, 212, 0]
放 item 3(高 250): 选第 2 列 → 列高 [312, 212, 262]
放 item 4(高 180): 选第 1 列(212 最矮) → 列高 [312, 404, 262]
放 item 5(高 220): 选第 2 列(262 最矮) → 列高 [312, 404, 494]
...
```

每次选最矮的列,全局高度差自然收敛。

### 2.4 为什么 item 必须带 `width / height`?

瀑布流最棘手的问题是:**放进 DOM 之前就得知道它多高**,否则没法决定"哪一列最短"。

- ✅ 接口返回图片 `width / height`(小红书、Pinterest 都这么做)
- ⚠️ 前端 `new Image()` 预加载取宽高(有额外请求,不推荐)

本文采用第 1 种,这也是为什么 Props 把 `width / height` 设为必填。

---

## 三、分步实现

### 步骤 1:组件最终 API 先敲定

```ts
// src/components/Waterfall/types.ts
export interface WaterfallItem {
  id: string | number;
  src: string;
  width: number; // 图片原始宽
  height: number; // 图片原始高
  title?: string;
  author?: string;
  avatar?: string;
  likes?: number;
}

export interface WaterfallProps<T extends WaterfallItem = WaterfallItem> {
  items: T[];
  columnWidth?: number; // 默认 240
  gap?: number; // 默认 12
  minColumns?: number; // 默认 2
  maxColumns?: number; // 默认 8
  renderFooter?: (item: T) => React.ReactNode;
  onItemClick?: (item: T, index: number) => void;
  onReachBottom?: () => void;
  reachBottomThreshold?: number; // 默认 200
  className?: string;
}
```

#### Props 完整表

| 属性                   | 类型                    | 默认值 | 必填 | 说明                               |
| ---------------------- | ----------------------- | :----: | :--: | ---------------------------------- |
| `items`                | `WaterfallItem[]`       |   —    |  ✅  | 每项必须带 `width / height`        |
| `columnWidth`          | `number`                | `240`  |      | 目标列宽(px)                       |
| `gap`                  | `number`                |  `12`  |      | 列间距 / 行间距                    |
| `minColumns`           | `number`                |  `2`   |      | 最少多少列                         |
| `maxColumns`           | `number`                |  `8`   |      | 最多多少列                         |
| `renderFooter`         | `(item) => ReactNode`   |   —    |      | 自定义卡片底部                     |
| `onItemClick`          | `(item, index) => void` |   —    |      | item 点击回调                      |
| `onReachBottom`        | `() => void`            |   —    |      | 触底回调(加载更多)                 |
| `reachBottomThreshold` | `number`                | `200`  |      | 距底部多少 px 触发 `onReachBottom` |

---

### 步骤 2:测量容器宽度

```tsx
// src/components/Waterfall/index.tsx(片段)
import { useEffect, useRef, useState } from 'react';

export function Waterfall(/* ... */) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={containerRef} style={{ position: 'relative', width: '100%' }} />;
}
```

为什么用 `ResizeObserver` 而不是 `window.resize`?后者感知不到"容器本身"变化(比如侧边栏收起、tab 切换)。

---

### 步骤 3:算出列数和实际列宽

```ts
function getColumnInfo(
  containerWidth: number,
  columnWidth: number,
  gap: number,
  minColumns: number,
  maxColumns: number
) {
  if (containerWidth <= 0) return { columns: 0, actualColumnWidth: 0 };

  const raw = Math.floor((containerWidth + gap) / (columnWidth + gap));
  const columns = Math.min(Math.max(raw, minColumns), maxColumns);
  const actualColumnWidth = (containerWidth - gap * (columns - 1)) / columns;
  return { columns, actualColumnWidth };
}
```

#### 公式推导

n 列排开:`n × columnWidth + (n - 1) × gap ≤ containerWidth`,移项得:

```
n ≤ (containerWidth + gap) / (columnWidth + gap)
```

算出 n 后再**反推实际列宽** — 把剩余空隙均摊出去,右边不会留白边。

---

### 步骤 4:核心布局算法(纯函数)

```ts
// src/components/Waterfall/computeLayout.ts
import type { WaterfallItem } from './types';

export interface LayoutPosition {
  top: number;
  left: number;
  width: number;
  height: number;
  column: number;
}

export function computeLayout(
  items: WaterfallItem[],
  columns: number,
  columnWidth: number,
  gap: number,
  footerHeight = 76
): { positions: LayoutPosition[]; containerHeight: number } {
  if (columns <= 0 || columnWidth <= 0) {
    return { positions: [], containerHeight: 0 };
  }

  const columnHeights = new Array(columns).fill(0);
  const positions: LayoutPosition[] = [];

  for (const item of items) {
    const imgHeight = (item.height / item.width) * columnWidth;
    const cardHeight = imgHeight + footerHeight;

    let shortestCol = 0;
    for (let i = 1; i < columns; i++) {
      if (columnHeights[i] < columnHeights[shortestCol]) shortestCol = i;
    }

    const top = columnHeights[shortestCol];
    const left = shortestCol * (columnWidth + gap);

    positions.push({ top, left, width: columnWidth, height: cardHeight, column: shortestCol });
    columnHeights[shortestCol] = top + cardHeight + gap;
  }

  return {
    positions,
    containerHeight: Math.max(...columnHeights) - gap,
  };
}
```

#### 为什么抽成纯函数?

1. **好测试**:给输入比对输出即可写单测
2. **好缓存**:用 `useMemo` 包,`items / columns` 不变就不重算
3. **好复用**:后续要和 `VirtualList` 组合做"虚拟化瀑布流",只需过滤 `positions` 里落在视口的项 — 纯函数天然适合这种场景

---

### 步骤 5:集成 `LazyImage` 渲染 item

```tsx
// src/components/Waterfall/index.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { LazyImage } from '@/components/LazyImage';
import { computeLayout } from './computeLayout';
import type { WaterfallItem, WaterfallProps } from './types';

export function Waterfall<T extends WaterfallItem>({
  items,
  columnWidth = 240,
  gap = 12,
  minColumns = 2,
  maxColumns = 8,
  renderFooter,
  onItemClick,
  className,
}: WaterfallProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { columns, actualColumnWidth } = useMemo(() => {
    if (containerWidth <= 0) return { columns: 0, actualColumnWidth: 0 };
    const raw = Math.floor((containerWidth + gap) / (columnWidth + gap));
    const cols = Math.min(Math.max(raw, minColumns), maxColumns);
    return { columns: cols, actualColumnWidth: (containerWidth - gap * (cols - 1)) / cols };
  }, [containerWidth, columnWidth, gap, minColumns, maxColumns]);

  const { positions, containerHeight } = useMemo(
    () => computeLayout(items, columns, actualColumnWidth, gap),
    [items, columns, actualColumnWidth, gap]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: containerHeight }}
    >
      {items.map((item, index) => {
        const pos = positions[index];
        if (!pos) return null;
        const imgHeight = (item.height / item.width) * pos.width;
        return (
          <div
            key={item.id}
            onClick={() => onItemClick?.(item, index)}
            style={{
              position: 'absolute',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              cursor: onItemClick ? 'pointer' : 'default',
              transition: 'top 200ms ease, left 200ms ease',
            }}
          >
            <LazyImage
              src={item.src}
              alt={item.title ?? ''}
              rootMargin="300px"
              style={{
                width: '100%',
                height: imgHeight,
                display: 'block',
                borderRadius: 8,
                objectFit: 'cover',
              }}
            />
            {renderFooter ? renderFooter(item) : <DefaultFooter item={item} />}
          </div>
        );
      })}
    </div>
  );
}

function DefaultFooter({ item }: { item: WaterfallItem }) {
  return (
    <div style={{ padding: '8px 4px' }}>
      {item.title && (
        <div
          style={{
            fontSize: 14,
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.title}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#999' }}>
        <span>{item.author}</span>
        <span>♥ {item.likes ?? 0}</span>
      </div>
    </div>
  );
}
```

#### 关键设计

- **容器高度要手动设 `containerHeight`**:子项全是 absolute 定位,容器不会被撑开
- **`transition` 让列数变化丝滑**:窗口从 4 列变 3 列,卡片会平滑滑到新位置
- **`rootMargin="300px"`**:瀑布流滚得快,提前 300px 就开始请求图片,避免白图
- **卡片高度完全由 props 的 `width/height` 算出**:图片加载前后尺寸一致,不会抖动

---

### 步骤 6:触底加载(IO 哨兵方案)

比起 `scroll` 监听,`IntersectionObserver` 观察一个哨兵节点性能更好,也和懒加载是同一套思路:

```tsx
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const el = sentinelRef.current;
  if (!el || !onReachBottom) return;
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) onReachBottom();
    },
    { rootMargin: `${reachBottomThreshold}px` }
  );
  io.observe(el);
  return () => io.disconnect();
}, [onReachBottom, reachBottomThreshold]);

// 渲染里放个 1px 高的哨兵在容器底部
<div ref={sentinelRef} style={{ position: 'absolute', top: containerHeight - 1, height: 1, width: '100%' }} />;
```

调用方只需要把接口的"加载下一页"函数传入 `onReachBottom`,`useState` 的数组追加新数据即可。

---

## 四、完整代码示例

最终文件结构:

```
src/components/Waterfall/
├── index.tsx          // 组件本体
├── computeLayout.ts   // 布局算法(纯函数)
└── types.ts           // WaterfallItem / WaterfallProps
```

`types.ts` 和 `computeLayout.ts` 见步骤 1、4;`index.tsx` 见步骤 5(触底部分见步骤 6,整合后一起加进去即可)。

### 使用示例 1:基础用法

```tsx
import { Waterfall } from '@/components/Waterfall';

const list = [
  { id: 1, src: '/img/1.jpg', width: 800, height: 1200, title: '...', author: 'A', likes: 123 },
  { id: 2, src: '/img/2.jpg', width: 800, height: 600, title: '...', author: 'B', likes: 88 },
];

export default function Demo() {
  return <Waterfall items={list} columnWidth={240} gap={12} />;
}
```

### 使用示例 2:配合接口分页

```tsx
const [list, setList] = useState<WaterfallItem[]>([]);
const [page, setPage] = useState(1);
const [loading, setLoading] = useState(false);

const loadMore = async () => {
  if (loading) return;
  setLoading(true);
  const res = await fetchImages(page);
  setList((prev) => [...prev, ...res.list]);
  setPage((p) => p + 1);
  setLoading(false);
};

useEffect(() => {
  loadMore();
}, []);

return <Waterfall items={list} columnWidth={220} gap={10} onReachBottom={loadMore} reachBottomThreshold={300} />;
```

### 使用示例 3:自定义底部

```tsx
<Waterfall
  items={list}
  renderFooter={(item) => (
    <div className="custom-footer">
      <h3>{item.title}</h3>
      <time>{item.publishedAt}</time>
    </div>
  )}
/>
```

---

## 五、常见问题与注意事项

| 现象                            | 原因                                      | 解决                                     |
| ------------------------------- | ----------------------------------------- | ---------------------------------------- |
| 所有卡片堆在左上角              | 容器没设 `position: relative`             | 容器样式加 `position: relative`          |
| 卡片高度不对、图片被拉伸        | 没传 `width / height` 或传错              | 检查接口,或 `new Image()` 兜底预加载     |
| 窗口拉宽后右侧留白              | 直接用了 `columnWidth` 而没反推"实际列宽" | 用 `(containerWidth - (n-1)*gap) / n`    |
| 切换列数时卡片闪一下            | 没加 transition,或 key 用了 index         | key 用 `item.id`;top/left 加 transition  |
| 图片全部一次性请求              | 没集成 `LazyImage`                        | 换成 `LazyImage` 并设合理的 `rootMargin` |
| 无限滚动一次触发多次            | scroll 触发密集 + 状态没锁                | 用 IO 哨兵 + `loading` 标志锁住          |
| SSR 报错找不到 `ResizeObserver` | 服务端没有该 API                          | `typeof window === 'undefined'` 时跳过   |
| 列底部参差不齐                  | `footerHeight` 估算不准,文字行数不统一    | footer 固定高度(`-webkit-line-clamp: 2`) |
| 数据量过大(> 3000 条)滚动卡顿   | 所有卡片都在 DOM 里                       | 上虚拟化(见第七节)                       |

---

## 六、扩展阅读

### 6.1 成熟的瀑布流库

| 库                            | 框架    | 说明                                                    |
| ----------------------------- | ------- | ------------------------------------------------------- |
| **react-masonry-css**         | React   | 纯 CSS 方案,体积小,不需要图片宽高                       |
| **react-photo-gallery**       | React   | 画廊专用,支持点击放大                                   |
| **masonry-layout**            | 原生 JS | Pinterest 同款老牌库,社区标杆,自己封装 React 包装也简单 |
| **vue-waterfall-plugin-next** | Vue     | Vue 3 瀑布流,API 干净                                   |

### 6.2 进阶话题

- **虚拟化瀑布流**:数据量 > 5000 时,用 `VirtualList` 思路过滤可视区内的 position
- **列间均衡进阶**:最短列优先不是最优解(会看起来"堆积")。更复杂的做法是先前瞻 N 项做动态规划,让总高差最小
- **图片质量切换**:用 `srcset` 按实际列宽加载不同分辨率,列宽 241px 时就不必加载 1080p

---

## 七、与 LazyLoad、VirtualList 的关系

### 7.1 在组件家族中的位置

| 组件            | 关心的维度 | 典型角色                                     |
| --------------- | ---------- | -------------------------------------------- |
| `LazyLoad`      | 可见性     | 底层"开关" — 被嵌在 `Waterfall` 的 item 内部 |
| **`Waterfall`** | 布局       | 中层"排版器"                                 |
| `VirtualList`   | DOM 数量   | 上层"渲染控制"                               |

### 7.2 组合关系(非继承)

#### 组合 ① Waterfall + LazyImage(本文默认做法)

每个卡片里的图片用 `LazyImage` 包裹,滚到才请求。**这是瀑布流的标配,不是可选项**。

#### 组合 ② VirtualList + Waterfall 的 `computeLayout`(数据量极大时)

数据量超过几千条时,即使布局算好了,DOM 里塞几千个绝对定位卡片依然会卡。这时组合虚拟列表:

```tsx
const positions = useMemo(() => computeLayout(items, columns, colWidth, gap), [...]);

const visibleItems = useMemo(() => {
  const buffer = 400;
  return items
    .map((item, i) => ({ item, pos: positions[i], index: i }))
    .filter(({ pos }) =>
      pos.top + pos.height > scrollTop - buffer &&
      pos.top < scrollTop + viewportHeight + buffer
    );
}, [items, positions, scrollTop, viewportHeight]);
```

布局算法不变,只是渲染子集变了。这就是为什么步骤 4 特地把 `computeLayout` 抽成**纯函数** — 它是瀑布流和虚拟化之间的桥梁。

### 7.3 决策表

| 数据规模           | 推荐组合                                          |
| ------------------ | ------------------------------------------------- |
| < 500 条图文       | `Waterfall` + `LazyImage`(本文方案)               |
| 500 ~ 3000 条      | `Waterfall` + `LazyImage`,注意 `rootMargin` 调大  |
| > 3000 条          | `Waterfall` 布局 + 自实现可视区过滤 + `LazyImage` |
| Pinterest 级(无穷) | 再加分页 + 触底加载,几乎就是 Pinterest 的做法     |

### 7.4 结论

React 官方推荐**组合而非继承**。`Waterfall` 的设计天然支持和 `LazyImage` / `VirtualList` 组合:

- `LazyImage` 作为子组件直接嵌在卡片里
- `computeLayout` 纯函数可以被虚拟列表复用

> 一句话总结:`LazyLoad` 管"现在要不要加载",`Waterfall` 管"应该摆在哪",`VirtualList` 管"DOM 里放几个"。三者配合,能从几十条一直扛到几十万条。
