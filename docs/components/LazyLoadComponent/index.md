# 从 0 实现一个懒加载组件(Lazy Load)

> 面向 React + TypeScript 初学者的实战教程。讲清楚"为什么要做懒加载""它的核心原理",然后一步步从 Hook 写到可复用组件,最后讨论它和 `Waterfall`、`VirtualList` 之间的组合关系。

---

## 一、什么是懒加载

### 1.1 核心概念一句话

> **只在资源/组件即将出现在视口时,才真正去加载它**,之前保持"占位但不请求"的状态。

### 1.2 一个直观对比

假设一个商品列表有 500 张图,首屏能看到 6 张:

| 方案         | 首屏网络请求 | 首屏耗时 | 用户只滚到一半的浪费 |
| ------------ | :----------: | :------: | :------------------: |
| 普通 `<img>` |    500 次    | 秒级卡顿 |   ~250 张图白下载    |
| 懒加载       |     6 次     |   毫秒   |        **0**         |

### 1.3 什么时候该上懒加载?

| 场景                         |     是否建议懒加载     |
| ---------------------------- | :--------------------: |
| 首屏就能看完的几张图         |           ❌           |
| 长页面里的大量图片 / 视频    |           ✅           |
| 复杂组件(图表、富文本、地图) |           ✅           |
| 路由或模块级代码包           | ✅ (配合 `React.lazy`) |

### 1.4 和 `React.lazy` 的区别

| 概念                    | 解决的问题                        | 工作层面          |
| ----------------------- | --------------------------------- | ----------------- |
| `React.lazy` + Suspense | **代码**按需分包,减小首屏 JS 体积 | 构建 / 模块加载层 |
| 本文 `LazyLoad` 组件    | **DOM/资源**按视口可见性按需渲染  | 运行时 / 视口层   |

两者经常组合使用,本文聚焦后者。

---

## 二、实现思路

### 2.1 整体原理

```
┌─── 用户视口 ───┐
│                │
│   ???          │ ← 目标元素还没进视口 → 不渲染,不请求
│                │
└────────────────┘
         ↓ 用户滚动
┌─── 用户视口 ───┐
│                │
│   ✅ 图片/组件  │ ← 进入视口 → 触发渲染 / 发起请求
│                │
└────────────────┘
```

实现靠一个浏览器原生 API:**`IntersectionObserver`**。

### 2.2 关键要素

| 要素                        | 含义                       | 来源                         |
| --------------------------- | -------------------------- | ---------------------------- |
| 目标 DOM 节点               | 要观察的元素               | `useRef` + `ref={ref}`       |
| `IntersectionObserver` 实例 | 浏览器提供的"可见性观察器" | `new IntersectionObserver()` |
| `isIntersecting` 布尔       | 是否已经进入视口           | observer 回调入参            |
| `rootMargin`                | 视口外扩多少 px 就提前触发 | props                        |
| `once` (一次性)             | 触发后是否不再观察         | props                        |

### 2.3 `IntersectionObserver` 最小示例

```ts
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        console.log('元素进入视口了!');
      }
    });
  },
  {
    root: null, // null 表示视口
    rootMargin: '0px', // '200px' 表示提前 200px
    threshold: 0, // 出现 1px 就算
  }
);
observer.observe(document.querySelector('#target')!);
```

懒加载整个组件就是围绕这个 API 封装的。

### 2.4 为什么不用 `scroll` + `getBoundingClientRect`?

| 方式                                    | 性能                              |
| --------------------------------------- | --------------------------------- |
| `scroll` 事件 + `getBoundingClientRect` | 每帧触发、强制 reflow、要自己节流 |
| `IntersectionObserver`                  | 浏览器空闲线程异步算,**零成本**   |

没理由再用老方案。

---

## 三、分步实现

### 步骤 1:最小可运行版本

先不考虑复用,用最朴素的方式跑通整条链路 — 图片滚到视口才加载:

```tsx
// src/components/LazyImageV1.tsx
import { useEffect, useRef, useState } from 'react';

interface Props {
  src: string;
  alt?: string;
}

export function LazyImageV1({ src, alt = '' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      });
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: 200, background: '#f5f5f5' }}>
      {visible ? <img src={src} alt={alt} /> : null}
    </div>
  );
}
```

### 这一步关注什么?

1. `useRef` 拿到真实 DOM 节点交给 observer
2. `visible=false` 时**不渲染 `<img>`** → 浏览器就不发请求,这是懒加载生效的核心
3. `unobserve` + `disconnect` 做好清理,避免内存泄漏
4. **必须给 `minHeight`**:如果容器高度是 0,它永远"在视口内",懒加载直接失效

---

### 步骤 2:抽成 `useInView` Hook

"观察元素是否在视口"跟"渲染图片"没有耦合,抽出来复用。

```ts
// src/hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const { root = null, rootMargin = '0px', threshold = 0, once = true } = options;

  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setInView(false);
          }
        });
      },
      { root, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once]);

  return [ref, inView] as const;
}
```

### 设计要点

1. **泛型 `<T extends Element>`**:让调用方决定 ref 挂在 `HTMLDivElement` 还是 `HTMLImageElement`
2. **`once` 选项**:
   - `true`(默认):触发一次后不再管,适合加载资源
   - `false`:进出视口都触发,适合视口内自动播放
3. **`typeof IntersectionObserver === 'undefined'` 兜底**:SSR 或极老浏览器直接设为 `true`,**不懒加载总比永远不加载好**
4. **`as const`**:让 TS 把返回类型推断成元组 `[ref, boolean]`

---

### 步骤 3:封装通用容器 `<LazyLoad>`

有了 Hook,包装成组件只需要几行:

```tsx
// src/components/LazyLoad.tsx
import { type ReactNode } from 'react';
import { useInView, type UseInViewOptions } from '@/hooks/useInView';

export interface LazyLoadProps extends UseInViewOptions {
  children: ReactNode;
  placeholder?: ReactNode;
  minHeight?: number | string;
  className?: string;
}

export function LazyLoad({
  children,
  placeholder = null,
  minHeight = 1,
  className,
  ...observerOptions
}: LazyLoadProps) {
  const [ref, inView] = useInView<HTMLDivElement>(observerOptions);

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {inView ? children : placeholder}
    </div>
  );
}
```

### 设计要点

- **`extends UseInViewOptions`**:Hook 的配置项透传,调用方不用感知 Hook 存在
- **`minHeight` 默认 `1`**:如果所有 `LazyLoad` 都是 0 高度,多个会同时进入视口,懒加载失效

---

### 步骤 4:衍生 `<LazyImage>`(带 placeholder 与 fallback)

图片是最常见场景,单独封装能把占位图、加载失败、淡入动画一次做好:

```tsx
// src/components/LazyImage.tsx
import { useState, type ImgHTMLAttributes } from 'react';
import { useInView } from '@/hooks/useInView';

export interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  fallback?: string;
  rootMargin?: string;
}

type Status = 'idle' | 'loaded' | 'error';

export function LazyImage({
  src,
  alt = '',
  placeholder,
  fallback,
  rootMargin = '100px',
  style,
  onLoad,
  onError,
  ...rest
}: LazyImageProps) {
  const [ref, inView] = useInView<HTMLImageElement>({ rootMargin, once: true });
  const [status, setStatus] = useState<Status>('idle');

  const realSrc = inView ? src : placeholder;
  const displaySrc = status === 'error' && fallback ? fallback : realSrc;

  return (
    <img
      ref={ref}
      src={displaySrc}
      alt={alt}
      style={{
        opacity: status === 'loaded' ? 1 : 0.6,
        transition: 'opacity 300ms ease',
        ...style,
      }}
      onLoad={(e) => {
        if (inView) setStatus('loaded');
        onLoad?.(e);
      }}
      onError={(e) => {
        setStatus('error');
        onError?.(e);
      }}
      {...rest}
    />
  );
}
```

### 设计要点

- **继承 `ImgHTMLAttributes`**:原生 img 所有属性都支持,调用方用法零学习成本
- **状态机 `idle → loaded / error`**:清晰控制三种 UI 表现
- **事件透传**:先处理自己的逻辑再调用用户传入的回调,不吞事件

---

### 步骤 5:SSR 与边界处理

- **SSR**:`useEffect` 服务端不执行,首屏会渲染 `placeholder`,水合后再切到真实内容会"闪一下"。如果用 Next.js 这类框架,可以在 Hook 加一个 `ssrRender` 参数:

  ```ts
  const [inView, setInView] = useState(ssrRender ?? false);
  ```

- **自定义滚动容器**:传 `root`:

  ```tsx
  const scrollRef = useRef<HTMLDivElement>(null);
  const [ref, inView] = useInView({ root: scrollRef.current });
  ```

- **动画配合**:用 `once: false`,进入 / 离开视口都可以触发不同动画

---

### 步骤 6:单例 Observer(进阶优化)

每个 `<LazyLoad>` 都 `new IntersectionObserver`,列表里 1000 个 item 就有 1000 个 observer。可以做单例:

```ts
const observed = new Map<Element, (inView: boolean) => void>();

const sharedObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    observed.get(entry.target)?.(entry.isIntersecting);
  });
});

export function observe(el: Element, cb: (inView: boolean) => void) {
  observed.set(el, cb);
  sharedObserver.observe(el);
  return () => {
    observed.delete(el);
    sharedObserver.unobserve(el);
  };
}
```

这是 `react-intersection-observer` 库的做法。一般列表 < 500 不需要做这步优化。

---

## 四、完整代码示例

把上面整合成可直接运行的一套代码:

```tsx
// src/hooks/useInView.ts
import { useEffect, useRef, useState } from 'react';

export interface UseInViewOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  once?: boolean;
}

export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const { root = null, rootMargin = '0px', threshold = 0, once = true } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) setInView(false);
        }),
      { root, rootMargin, threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [root, rootMargin, threshold, once]);

  return [ref, inView] as const;
}
```

```tsx
// src/components/LazyImage.tsx
import { useState, type ImgHTMLAttributes } from 'react';
import { useInView } from '@/hooks/useInView';

export interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  placeholder?: string;
  fallback?: string;
  rootMargin?: string;
}

export function LazyImage({
  src,
  alt = '',
  placeholder,
  fallback,
  rootMargin = '100px',
  style,
  onLoad,
  onError,
  ...rest
}: LazyImageProps) {
  const [ref, inView] = useInView<HTMLImageElement>({ rootMargin, once: true });
  const [status, setStatus] = useState<'idle' | 'loaded' | 'error'>('idle');

  const realSrc = inView ? src : placeholder;
  const displaySrc = status === 'error' && fallback ? fallback : realSrc;

  return (
    <img
      ref={ref}
      src={displaySrc}
      alt={alt}
      style={{ opacity: status === 'loaded' ? 1 : 0.6, transition: 'opacity 300ms ease', ...style }}
      onLoad={(e) => {
        if (inView) setStatus('loaded');
        onLoad?.(e);
      }}
      onError={(e) => {
        setStatus('error');
        onError?.(e);
      }}
      {...rest}
    />
  );
}
```

### 使用示例

```tsx
import { LazyLoad } from '@/components/LazyLoad';
import { LazyImage } from '@/components/LazyImage';

export default function Demo() {
  return (
    <>
      <LazyImage src="/big.jpg" alt="banner" placeholder="/blur.jpg" fallback="/error.png" rootMargin="200px" />

      <LazyLoad minHeight={320} rootMargin="300px" placeholder={<Skeleton />}>
        <ExpensiveChart />
      </LazyLoad>
    </>
  );
}
```

---

## 五、常见问题与注意事项

| 现象                     | 原因                                      | 解决                                          |
| ------------------------ | ----------------------------------------- | --------------------------------------------- |
| 所有组件一次性全部加载   | 容器高度为 0,全部堆叠在视口内             | 给 `minHeight`                                |
| 自定义滚动容器不生效     | `root` 默认为 `null`(视口)                | 把容器元素作为 `root` 传入                    |
| 加载完又触发一次         | 没设 `once` 或自己重写了逻辑              | 确认 `once: true`                             |
| SSR 白屏                 | 服务端 `inView=false`,placeholder 为空    | 提供合理 `placeholder` 或 `ssrRender`         |
| 图片闪一下才出现         | 没有 placeholder / 没有过渡               | 加低清占位图 + opacity transition             |
| 旧浏览器不生效           | 不支持 `IntersectionObserver`             | Hook 已兜底 `setInView(true)`;或引入 polyfill |
| 组件一直显示 placeholder | ref 没传到 DOM 节点上,或挂在了 `Fragment` | ref 必须挂在真实 DOM 元素上                   |

---

## 六、扩展阅读

### 6.1 成熟的懒加载库

| 库                                  | 说明                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| **react-intersection-observer**     | 最流行的 IO Hook/组件封装,单例 observer 优化                                      |
| **react-lazy-load-image-component** | 图片懒加载专用,内置占位图、blur-up 效果                                           |
| **`<img loading="lazy">`**          | 浏览器原生懒加载,**现代浏览器几乎都支持**,推荐作为二级保险(和自研 LazyImage 共存) |

### 6.2 进阶话题

- **Blur-up 占位**:先加载极小的模糊图(几 KB),加载完后切换到大图,体感接近 0 延迟
- **响应式图片 + 懒加载**:结合 `srcset` + `sizes`,按屏幕 DPR 加载合适尺寸
- **视口内自动播放 / 暂停视频**:`once: false`,`isIntersecting` 切 `.play()` / `.pause()`
- **Priority Hints**:首屏图加 `fetchpriority="high"`,非首屏用懒加载,浏览器会智能排队

---

## 七、与 Waterfall、VirtualList 的关系

### 7.1 `LazyLoad` 是"地基能力"

三个组件在三个正交维度上工作:

| 组件           | 关心的维度 | 省下了什么                | 典型场景           |
| -------------- | ---------- | ------------------------- | ------------------ |
| **`LazyLoad`** | 可见性     | 省**网络请求 / 子树渲染** | 图片、图表、富文本 |
| `Waterfall`    | 布局       | 省**首屏等待**            | 图文 Feed 流       |
| `VirtualList`  | DOM 数量   | 省**节点 + 计算**         | 万条级长列表       |

`LazyLoad` / `LazyImage` 是**最底层的能力**,`Waterfall` 和 `VirtualList` 的 item 里通常会嵌套它。

### 7.2 组合关系

- **Waterfall + LazyImage**:瀑布流的每张图都用 `LazyImage`。见 [瀑布流文档](../WaterfallComponent/index.md) 第三节步骤 5
- **VirtualList + LazyImage**:长列表每条的图片/封面用 `LazyImage`。overscan 区域的节点虽然在 DOM,但图片依旧不请求,实现"双重懒加载"
- **Waterfall + VirtualList + LazyImage**:Pinterest 级数据量的终极组合。见 [虚拟列表文档](../VirtualListComponent/index.md) 第七节

### 7.3 结论:组合而非继承

React 官方推荐组合而非继承。`LazyLoad` 不需要"被继承",它是一个**通用能力节点**,哪里需要"视口内才工作"就嵌一层即可。

> 一句话总结:`LazyLoad` 是齿轮,`Waterfall` 是齿轮箱的布局,`VirtualList` 是齿轮箱的渲染控制。三者配合,就能造出任何规模的图文展示机器。
