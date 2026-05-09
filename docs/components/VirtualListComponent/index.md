# 从 0 实现一个虚拟列表组件(Virtual List)

> 面向 React + TypeScript 初学者的实战教程。讲清楚"为什么要做虚拟列表""它的核心原理",然后一步步从定高版本写到动态高度版本,最后讨论它和 `LazyLoad`、`Waterfall` 之间的组合关系。

---

## 一、什么是虚拟列表

### 1.1 核心概念一句话

> **不管数据有 1 万条还是 10 万条,DOM 里永远只保留"屏幕能看到的那一屏"节点**,其它都不渲染,滚动时动态"换上/换下"。

### 1.2 一个直观对比

假设有 10000 条数据,可视区高度 600px,每项高 50px:

| 方案     | 实际渲染 DOM 数     | 首屏耗时        | 滚动表现    |
| -------- | ------------------- | --------------- | ----------- |
| 普通列表 | 10000 个 `<li>`     | 秒级卡顿 / 白屏 | 卡、掉帧    |
| 虚拟列表 | ~12 个(可视 + 缓冲) | 毫秒级          | 60 FPS 流畅 |

差距可以达到 **1000 倍**,这不是微优化,是量级差距。

### 1.3 什么时候该上虚拟列表?

| 场景                                   | 是否需要虚拟列表 |
| -------------------------------------- | :--------------: |
| 列表项 < 100                           |    ❌ 没必要     |
| 列表项 100~500,项内容简单              |  ⚠️ 视情况而定   |
| 列表项 > 500,或项内容复杂(图表/富文本) |   ✅ 强烈推荐    |
| 聊天记录、日志查看器、表格、大 Feed 流 |     ✅ 必需      |

**判断依据**:打开 DevTools Performance,如果滚动时 FPS < 50 或者 Scripting 时间过长,就该做虚拟列表了。

### 1.4 和"懒加载"的区别

| 概念         | 省什么              | 节省的东西                    |
| ------------ | ------------------- | ----------------------------- |
| **懒加载**   | 省"网络请求"        | DOM 依旧存在,只是资源延迟请求 |
| **虚拟列表** | 省"DOM 节点 + 计算" | 整个节点都不存在于 DOM        |

两者解决的是不同层面的问题,**通常需要组合使用**(第七节会详细讨论)。

---

## 二、实现思路

### 2.1 整体原理

```
┌─────────────────── 滚动容器 (固定高度, overflow: auto) ───────────────┐
│                                                                      │
│  ┌─────────────── 内层占位容器 (高度 = 数据总高度) ────────────────┐  │
│  │                                                                │  │
│  │         ┌─ 可视区域(实际只渲染这部分) ─┐                          │  │
│  │         │ item 12                        │                          │  │
│  │         │ item 13                        │ ← 用 transform 推到对应位置 │  │
│  │         │ item 14                        │                          │  │
│  │         └────────────────────────────────┘                          │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

三层结构的作用:

1. **滚动容器**:固定高度 + `overflow: auto`,负责产生滚动条
2. **内层占位容器**:高度撑到"数据总高度"(10000 × 50 = 500000px),让滚动条长度正确
3. **可视区域容器**:只放当前要渲染的几条,用 `transform: translateY(...)` 推到该出现的位置

### 2.2 关键要素

| 要素                    | 含义                     | 来源                                  |
| ----------------------- | ------------------------ | ------------------------------------- |
| `containerHeight`       | 可视区域的高度           | 用户传入 / `ResizeObserver` 测量      |
| `itemHeight`            | 单个列表项的高度         | 定高:props 传;动态高:测量 + 缓存      |
| `scrollTop`             | 当前滚动偏移量           | `scroll` 事件                         |
| `startIndex / endIndex` | 可视范围的起止索引       | 通过 `scrollTop` 和 `itemHeight` 计算 |
| `overscan` (缓冲区)     | 可视区上下额外多渲染几项 | 用户传入,默认 3~5                     |

### 2.3 核心公式(定高情况)

```ts
startIndex = Math.floor(scrollTop / itemHeight);
endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight) - 1;
offsetY = startIndex * itemHeight; // 用 translateY 推可视区容器
totalHeight = items.length * itemHeight; // 占位容器高度
```

后面每一步做的事情本质上都是在围绕这 4 个变量转。

---

## 三、分步实现

### 步骤 1:搭建基础结构

先把三层 DOM 结构和样式写好,不放任何计算逻辑,确保能滚动:

```tsx
// src/components/VirtualList/index.tsx
import { type ReactNode, useState } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
}

export function VirtualList<T>({ items, itemHeight, containerHeight, renderItem }: VirtualListProps<T>) {
  const totalHeight = items.length * itemHeight;

  return (
    <div
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {items.map((item, index) => (
          <div key={index} style={{ height: itemHeight }}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 这一步关注什么?

- 三层结构齐了(`外层滚动 → 占位容器 → item`)
- 先把**所有 item 都渲染**,验证滚动条高度是对的
- 下一步我们会把"全部渲染"改成"只渲染可视区"

---

### 步骤 2:计算可视区范围

抽一个纯函数 `getRange`,输入滚动位置输出起止索引:

```ts
// src/components/VirtualList/getRange.ts
export function getRange(scrollTop: number, containerHeight: number, itemHeight: number, totalCount: number) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight) - 1;

  return {
    startIndex: Math.max(0, startIndex),
    endIndex: Math.min(totalCount - 1, endIndex),
  };
}
```

### 公式图解

`scrollTop = 510`,`itemHeight = 50`,`containerHeight = 600`:

```
startIndex = Math.floor(510 / 50) = 10          // 第 10 项刚滚出一半
endIndex   = Math.ceil((510 + 600) / 50) - 1    // = Math.ceil(22.2) - 1 = 22
→ 渲染第 10 ~ 22 项,共 13 个
```

### 为什么抽成纯函数?

- 可以单独写单元测试(给 `scrollTop` 一堆值,验证输出)
- 可以用 `useMemo` 精准缓存,避免无意义的重算

---

### 步骤 3:渲染可见数据

把步骤 1 的"全量渲染"改成"只渲染范围内的 item":

```tsx
import { useMemo, useState } from 'react';
import { getRange } from './getRange';

export function VirtualList<T>({ items, itemHeight, containerHeight, renderItem }: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  const { startIndex, endIndex } = useMemo(
    () => getRange(scrollTop, containerHeight, itemHeight, items.length),
    [scrollTop, containerHeight, itemHeight, items.length]
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto', position: 'relative' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => (
            <div key={startIndex + i} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 关键点解读

1. **`transform: translateY(offsetY)` 而不是 `marginTop`**
   - `transform` 走 GPU 合成,不触发 layout,性能最好
   - `marginTop` 会触发重排
2. **`key={startIndex + i}` 用真实索引**
   - 否则滚动时 React 会误以为"还是那几个节点",导致状态错乱
3. **占位容器的 `height: totalHeight` 一定不能漏**
   - 否则滚动条长度不对,滚动到一半就到底了

---

### 步骤 4:处理滚动事件(节流优化)

`onScroll` 回调每秒可能触发 60+ 次,每次都 `setState` 会引起大量 re-render。

#### 方案 A:`requestAnimationFrame` 节流(推荐)

```ts
import { useCallback, useRef } from 'react';

function useRafScroll(onScroll: (scrollTop: number) => void) {
  const ticking = useRef(false);

  return useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        onScroll(target.scrollTop);
        ticking.current = false;
      });
    },
    [onScroll]
  );
}
```

用法:

```tsx
const handleScroll = useRafScroll(setScrollTop);
// ...
<div onScroll={handleScroll}>...
```

#### 为什么用 rAF 而不是 `setTimeout`?

- rAF 和浏览器渲染节奏同步,一帧最多跑一次,**既不会漏帧也不会多跑**
- `throttle(fn, 16)` 时间不精确,可能和渲染帧错位,导致抖动

---

### 步骤 5:支持动态高度(可选但常见)

定高版本已经能应付 80% 场景。但如果 item 是**评论、商品卡片、长短不一的文字**,需要动态测量。

#### 思路:测量 + 缓存 + 位置表

```ts
class HeightCache {
  private heights: number[] = [];
  private positions: number[] = [];

  constructor(
    private estimated: number,
    private total: number
  ) {
    this.heights = new Array(total).fill(estimated);
    this.rebuildPositions();
  }

  private rebuildPositions() {
    this.positions = [];
    let offset = 0;
    for (let i = 0; i < this.heights.length; i++) {
      this.positions[i] = offset;
      offset += this.heights[i];
    }
  }

  setHeight(index: number, height: number) {
    if (this.heights[index] === height) return;
    this.heights[index] = height;
    let offset = this.positions[index];
    for (let i = index; i < this.heights.length; i++) {
      this.positions[i] = offset;
      offset += this.heights[i];
    }
  }

  getPosition(index: number) {
    return this.positions[index];
  }
  getHeight(index: number) {
    return this.heights[index];
  }
  getTotalHeight() {
    const last = this.heights.length - 1;
    return this.positions[last] + this.heights[last];
  }

  /** 二分查找:给 scrollTop 找到第一个 top >= scrollTop 的索引 */
  findIndex(scrollTop: number) {
    let lo = 0,
      hi = this.heights.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.positions[mid] + this.heights[mid] < scrollTop) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
```

#### 配合 `ResizeObserver` 测量真实高度

```tsx
function MeasuredItem({ index, cache, onResize, children }: { /* ... */ }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      onResize(index, entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, onResize]);

  return <div ref={ref}>{children}</div>;
}
```

渲染时用 `cache.getPosition(index)` 代替 `index * itemHeight`。**动态高度** = 估算高度 + 渲染后实测 + 位置表修正 + 二分查找。

---

### 步骤 6:添加缓冲区(overscan)

快速滚动时,如果只渲染严格可视区,会看到"滚得快一点就露出白底"的现象。解决办法:上下各多渲染几项。

```ts
export function getRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalCount: number,
  overscan = 3 // 新增参数
) {
  const start = Math.floor(scrollTop / itemHeight);
  const end = Math.ceil((scrollTop + containerHeight) / itemHeight) - 1;

  return {
    startIndex: Math.max(0, start - overscan),
    endIndex: Math.min(totalCount - 1, end + overscan),
  };
}
```

### `overscan` 怎么选?

| 场景                   | 建议值 |
| ---------------------- | ------ |
| 普通列表               | 3~5    |
| 内容含图片/复杂组件    | 5~10   |
| 滚动特别快(如按住滚轮) | 10~20  |

取太大会抵消虚拟列表的意义,取太小会白屏,**按"一屏能滚多少帧"来估**。

---

## 四、完整代码示例

把上面 6 步整合成一个可直接复制粘贴运行的定高版本(动态高度版本按步骤 5 拓展):

```tsx
// src/components/VirtualList/index.tsx
import { useCallback, useMemo, useRef, useState, type ReactNode, type UIEvent } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem,
  className,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const rafTicking = useRef(false);

  const handleScroll = useCallback((e: UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (rafTicking.current) return;
    rafTicking.current = true;
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
      rafTicking.current = false;
    });
  }, []);

  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.ceil((scrollTop + containerHeight) / itemHeight) - 1;
    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const visibleItems: ReactNode[] = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      <div key={i} style={{ height: itemHeight }}>
        {renderItem(items[i], i)}
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform',
          }}
        >
          {visibleItems}
        </div>
      </div>
    </div>
  );
}
```

### 使用示例

```tsx
import { VirtualList } from '@/components/VirtualList';

const list = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  title: `第 ${i + 1} 条数据`,
}));

export default function Demo() {
  return (
    <VirtualList
      items={list}
      itemHeight={50}
      containerHeight={600}
      overscan={5}
      renderItem={(item) => (
        <div style={{ padding: '0 16px', lineHeight: '50px', borderBottom: '1px solid #eee' }}>{item.title}</div>
      )}
    />
  );
}
```

打开 DevTools → Elements,你会发现不管数据多少,DOM 里永远只有十几个 `<div>`。

---

## 五、常见问题与注意事项

### 5.1 滚动卡顿怎么优化?

| 手段                                     | 作用                         |
| ---------------------------------------- | ---------------------------- |
| 用 `transform` 而不是 `top/marginTop`    | 走 GPU,避免 layout / paint   |
| 外层和内层都加 `willChange: 'transform'` | 提前告诉浏览器创建合成层     |
| `onScroll` 用 rAF 节流                   | 保证一帧只 setState 一次     |
| 给 `renderItem` 的输出 `React.memo`      | 避免 item 内容 re-render     |
| item 内容别放过多 DOM(比如超深嵌套)      | 每个 item 的渲染成本也要控制 |

### 5.2 数据动态更新(增删改)怎么处理?

- **追加(无限滚动)**:`setItems(prev => [...prev, ...newItems])`,然后最好配合**触底检测**(`IntersectionObserver` 哨兵)
- **插入 / 删除中间项**:定高版本无需特殊处理;动态高版本要**更新 `HeightCache` 里 `index` 之后的所有位置**
- **修改单项内容**:注意 `key` 要用 `item.id` 而不是 `index`,否则会错位
- **全量替换(切换筛选)**:记得 `setScrollTop(0)` 并且主动把 `scrollTop` 设回 0

### 5.3 滚动条位置相关的边界情况

| 边界                   | 处理                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| 数据为空               | `totalHeight = 0`,组件显示空状态                                            |
| 数据还没到底就滚到底   | 配合 `onReachBottom` 触底回调                                               |
| 窗口 resize            | `ResizeObserver` 监听容器,重新计算 `containerHeight`                        |
| 初始就定位到某一项     | 对外暴露 `scrollToIndex(i)` 方法,内部调 `scrollTo({ top: i * itemHeight })` |
| 动态高度时滚动到固定项 | 用 `cache.getPosition(i)` 获取精确偏移                                      |

### 5.4 其他常见坑

- **父级高度塌陷**:虚拟列表外层必须有明确高度,`height: 100%` 的话父级也得有高度
- **`<table>` 不能直接虚拟化**:`table-layout` 会强制所有行存在。要虚拟化表格请用 `div` + `grid` 模拟
- **`iframe` / `position: fixed` 嵌套**:`ResizeObserver` 可能不触发,需手动监听父级事件

---

## 六、扩展阅读

### 6.1 成熟的虚拟列表库

| 库                          | 框架  | 适用场景                                                |
| --------------------------- | ----- | ------------------------------------------------------- |
| **react-window**            | React | 轻量(~6KB),功能精炼,fixed/variable size 都支持,**首选** |
| **react-virtualized**       | React | 功能更全(表格、多列网格),但体积大、已停止主维护         |
| **@tanstack/react-virtual** | React | headless,最灵活,Tanstack 生态,新项目推荐                |
| **react-virtuoso**          | React | 开箱即用动态高度 + 聊天模式,API 友好                    |
| **vue-virtual-scroller**    | Vue   | Vue 生态事实标准                                        |

### 6.2 进阶话题

- **双向虚拟(瀑布流 / 横纵网格)**:`react-virtualized-grid` / `@tanstack/react-virtual` 的 `horizontal` 模式
- **聊天室反向滚动**:保持"用户当前视线位置"而不是 `scrollTop` — 新消息从顶部插入时需 scroll anchor
- **Intersection Observer 版虚拟列表**:不依赖 `scroll` 事件,用 IO 观察占位符,适合嵌套滚动容器

---

## 七、与 LazyLoad、Waterfall 的关系

> React 里组件之间没有真正的"继承",一切靠**组合(composition)**。下面讲清楚这三个组件在能力上是什么关系、实践中怎么组合。

### 7.1 三者到底解决什么问题

| 组件          | 关心的维度 | 省下了什么                | 典型场景               |
| ------------- | ---------- | ------------------------- | ---------------------- |
| `LazyLoad`    | "可见性"   | 省**网络请求 / 子树渲染** | 图片、图表、富文本模块 |
| `Waterfall`   | "布局"     | 省**用户等待首屏**        | 图文 Feed 流           |
| `VirtualList` | "DOM 数量" | 省**节点 + 计算**         | 万条级长列表           |

它们不是谁替代谁,而是在**三个正交的维度**上各管一摊:

```
    ┌────────────────┐
    │   LazyLoad     │ ← "这个子节点要不要现在加载/渲染?"
    └────────────────┘
    ┌────────────────┐
    │   Waterfall    │ ← "这些卡片应该摆在哪个位置?"
    └────────────────┘
    ┌────────────────┐
    │   VirtualList  │ ← "一共 1 万条,我现在只要留哪几条在 DOM 里?"
    └────────────────┘
```

### 7.2 能不能"继承"?答案:不需要

React 文档明确推荐**组合而非继承**。我们要做的是把它们层层嵌套/组合。

### 7.3 三种组合方式

#### 组合 ① `VirtualList` 内部用 `LazyImage`

最常见。长列表里每条带一张头像/封面:

```tsx
<VirtualList
  items={users}
  itemHeight={80}
  containerHeight={600}
  renderItem={(user) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: 12 }}>
      <LazyImage src={user.avatar} width={56} height={56} />
      <span style={{ marginLeft: 12 }}>{user.name}</span>
    </div>
  )}
/>
```

**为什么还要 LazyImage**?虚拟列表的 overscan 里的节点已经存在于 DOM,如果不用 LazyImage,这几条的图片依旧会发起请求。组合后:**视口外完全不渲染,overscan 区域也不请求图片**,双保险。

#### 组合 ② `Waterfall` 内部用 `LazyImage`

(你在 Waterfall 的 Step 5 里已经做过。)图文 Feed 天生配图懒加载。

#### 组合 ③ `VirtualList` + `Waterfall` = 虚拟化瀑布流

Pinterest 级数据量(上万条)才需要。做法:

1. 先用 `Waterfall` 的 `computeLayout` **一次性算出所有 item 的 `top/left/width/height`**(纯函数,极快)
2. 监听滚动 `scrollTop`,过滤出"位置落在可视区 + overscan 内的 item"
3. 只把这些 item 渲染到 DOM

伪代码:

```tsx
const positions = useMemo(() => computeLayout(items, columns, colWidth, gap), [...]);
const visibleIndexes = positions
  .map((p, i) => ({ ...p, i }))
  .filter(p => p.top + p.height > scrollTop - buffer && p.top < scrollTop + viewport + buffer);
```

布局算法仍然是瀑布流那套,只是**渲染的子集变了**。这就是为什么第二篇我强调 `computeLayout` 要抽成纯函数 — 纯函数才能方便地用在虚拟化场景里。

### 7.4 组合决策表

| 数据量 / 场景           | 推荐组合                                                   |
| ----------------------- | ---------------------------------------------------------- |
| 带图的普通列表 < 100 条 | 只用 `LazyImage`                                           |
| 图文 Feed 流 < 500 条   | `Waterfall` + `LazyImage`                                  |
| 纯文本长列表 > 1000 条  | 只用 `VirtualList`                                         |
| 带图的长列表 > 1000 条  | `VirtualList` + `LazyImage`                                |
| 图文 Feed 流 > 5000 条  | `VirtualList` + `Waterfall 的 computeLayout` + `LazyImage` |

### 7.5 小结

- `LazyLoad` 是最底层的**能力**(订阅元素可见性)
- `Waterfall` 是一种**布局**(依赖 LazyImage 作为子组件提升体验)
- `VirtualList` 是一种**渲染策略**(可以包裹任何子组件,包括前两者)

三者在代码上没有依赖,但在产品体验上相辅相成。理解它们各管哪一层,就能按场景自由组合,不需要到处找轮子。
