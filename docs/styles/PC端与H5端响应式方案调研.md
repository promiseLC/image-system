# PC 端与 H5 端响应式方案调研

> 目标:一套代码,同时适配 PC 端(桌面浏览器)和 H5 端(移动端浏览器)。
>
> 适用范围:本项目(`React 19 + Vite + TailwindCSS v4 + SCSS Modules + CSS Variables + Ant Design v6`)。

---

## 目录

- [一、问题背景](#一问题背景)
- [二、主流方案横向对比](#二主流方案横向对比)
- [三、方案详解](#三方案详解)
  - [3.1 媒体查询(Media Queries)](#31-媒体查询media-queries)
  - [3.2 rem + 动态根字体(Flexible)](#32-rem--动态根字体flexible)
  - [3.3 vw / vh 视口单位](#33-vw--vh-视口单位)
  - [3.4 Flex / Grid 弹性布局](#34-flex--grid-弹性布局)
  - [3.5 容器查询(Container Queries)](#35-容器查询container-queries)
  - [3.6 条件渲染(两套组件 / 两套路由)](#36-条件渲染两套组件--两套路由)
  - [3.7 混合方案(推荐)](#37-混合方案推荐)
- [四、本项目推荐方案](#四本项目推荐方案)
- [五、改造思路参考](#五改造思路参考)
- [六、常见坑与避雷](#六常见坑与避雷)
- [七、参考资料](#七参考资料)

---

## 一、问题背景

"一套代码同时适配 PC 和 H5"通常有两条大路:

1. **自适应(Adaptive)**:根据设备类型 / 屏幕宽度,切换不同的布局、组件结构,甚至不同的路由。用户在 PC 看到 PC 布局,在手机看到 H5 布局。
2. **响应式(Responsive)**:用同一套布局,通过 CSS 让元素在不同视口下自动伸缩、换行、重排,不切换组件结构。

工程上经常是 **二者混合**:

- 简单页面(列表、详情、表单)——响应式即可;
- 重布局差异大的页面(后台管理 vs 手机工具页)——需要自适应(布局容器或组件层面切换)。

下面把目前业界主流的实现手段梳理一遍。

---

## 二、主流方案横向对比

| 方案                            | 核心思想                                           | 适用场景                               | 优点                                          | 缺点                                                        | 推荐度        |
| ------------------------------- | -------------------------------------------------- | -------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- | ------------- |
| ① 媒体查询(Media Queries)       | 按 `min-width` / `max-width` 断点写多套样式        | 响应式布局;PC 与 H5 布局结构基本一致   | 原生、学习成本低、可和 Tailwind/SCSS 完美结合 | 断点多时样式散、结构差异大时难维护                          | ★★★★★         |
| ② rem + 动态根字体              | JS 动态改 `html` 的 `font-size`,CSS 用 `rem`       | 纯 H5(设计稿按 375/750 还原)           | 等比缩放精准、适合还原设计稿                  | PC 端放大过大/小、需要额外脚本、与 Tailwind 默认 `rem` 冲突 | ★★★(H5 单端)  |
| ③ vw / vh 视口单位              | 直接用 `vw` 作为长度单位                           | H5 还原设计稿                          | 无需 JS、纯 CSS                               | 同 rem 方案在 PC 上会拉伸;长文字会丢粒度                    | ★★★(H5 单端)  |
| ④ Flex / Grid 弹性布局          | 布局天然可伸缩                                     | 大部分常规布局                         | 原生、性能好、简单                            | 极端断点下仍需媒体查询配合                                  | ★★★★★         |
| ⑤ 容器查询(Container Queries)   | 按"容器宽度"响应(非视口宽度)                       | 组件级响应(同一组件在不同容器里自适应) | 组件复用性极强、无需外部感知                  | 新特性、需 Chrome 105+ / Safari 16+、降级成本               | ★★★★(新项目)  |
| ⑥ 条件渲染(两套组件 / 两套路由) | JS 判断 UA 或 `matchMedia`,渲染不同组件/路由       | PC 后台 + 独立 H5 站点,差异极大        | 结构可以完全不同、各自极致优化                | 包体增大、逻辑分叉多、需要跨端状态同步                      | ★★★(差异大时) |
| ⑦ 混合方案                      | 媒体查询 + Flex/Grid + 关键节点条件渲染 + CSS 变量 | 大多数"PC + H5 一套代码"的中后台项目   | 综合成本最低、灵活、可渐进演进                | 需要约定清晰的断点体系和组件边界                            | ★★★★★(推荐)   |

> TL;DR:**多数项目选择 ⑦ 混合方案**——以媒体查询为骨架,Flex/Grid 填充细节,关键差异点用条件渲染兜底。rem/vw 仅适合"纯 H5"项目,PC 上会出问题。

---

## 三、方案详解

### 3.1 媒体查询(Media Queries)

最经典也最通用的方案。通过 `@media (min-width: ...)` 在不同视口下应用不同样式。

**示例:**

```scss
.container {
  padding: 16px;

  @media (min-width: 768px) {
    padding: 24px;
  }

  @media (min-width: 1280px) {
    padding: 32px;
    max-width: 1200px;
    margin: 0 auto;
  }
}
```

**与 TailwindCSS v4 结合(项目已引入):**

```tsx
<div className="p-4 md:p-6 xl:p-8 xl:max-w-[1200px] xl:mx-auto">...</div>
```

Tailwind 默认断点:

| 前缀   | 最小宽度 | 含义                |
| ------ | -------- | ------------------- |
| `sm:`  | 640px    | 小屏(横屏手机/平板) |
| `md:`  | 768px    | 平板                |
| `lg:`  | 1024px   | 小桌面              |
| `xl:`  | 1280px   | 桌面                |
| `2xl:` | 1536px   | 大桌面              |

**本项目可约定的断点语义:**

```scss
// src/styles/breakpoints.scss(建议新增)
$bp-mobile: 0; // 移动端(默认)
$bp-tablet: 768px; // 平板
$bp-desktop: 1024px; // PC
$bp-wide: 1440px; // 宽屏

@mixin mobile-only {
  @media (max-width: #{$bp-tablet - 1px}) {
    @content;
  }
}
@mixin tablet-up {
  @media (min-width: #{$bp-tablet}) {
    @content;
  }
}
@mixin desktop-up {
  @media (min-width: #{$bp-desktop}) {
    @content;
  }
}
```

**使用:**

```scss
// src/pages/images/index.module.scss
.grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;

  @include tablet-up {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  @include desktop-up {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
}
```

**优点**

- 原生、零依赖、SSR 友好;
- 可与 Tailwind、SCSS、CSS Modules 无缝组合;
- 可针对任意属性(`display`、`grid`、`font-size`…)响应。

**缺点**

- 结构差异较大时代码会膨胀(同一组件写多套样式);
- 需要预先设计好断点体系,否则散乱难维护。

---

### 3.2 rem + 动态根字体(Flexible)

**原理:** 给 `html` 动态设置 `font-size`(如视口宽度 / 10),所有尺寸用 `rem` 写,页面整体按视口等比缩放。代表实现:阿里 `lib-flexible`、`postcss-pxtorem`。

**示例:**

```ts
// 伪代码
function setRem() {
  const designWidth = 375; // 设计稿宽度
  const rem = (document.documentElement.clientWidth / designWidth) * 100;
  document.documentElement.style.fontSize = rem + 'px';
}
window.addEventListener('resize', setRem);
setRem();
```

```scss
.title {
  font-size: 0.32rem; // 设计稿 32px
  padding: 0.16rem; // 设计稿 16px
}
```

配合 `postcss-pxtorem` 可以**直接写 px**,构建时自动转换。

**优点**

- H5 还原设计稿非常精准,适合"按 375/750 像素稿还原"的场景;
- 纯 CSS + 一段 JS,方案成熟。

**缺点(对一套代码 PC+H5 是硬伤)**

- PC 端窗口很宽时,整体会被等比放大,按钮、文字巨大;需要加"最大宽度限制",体验仍奇怪;
- 与 **TailwindCSS 冲突**:Tailwind 的 `text-base`、`p-4` 等内部就是 `rem`,一旦改了根字体,Tailwind 全局尺寸会跟着变,失控;
- Ant Design 默认 `px`,与 rem 体系割裂。

**结论:** 只推荐用于**纯 H5 项目**,一旦需要同时覆盖 PC,不要采用此方案。

---

### 3.3 vw / vh 视口单位

**原理:** `1vw = 视口宽度的 1%`,直接用 vw 写尺寸。可配合 `postcss-px-to-viewport`。

```scss
.title {
  font-size: 4.27vw; // 375 设计稿下相当于 16px
  padding: 3.2vw;
}
```

**优点 / 缺点**与 rem 方案基本一致:

- 优点:无需 JS;
- 缺点:PC 端会拉伸、大屏下文字过大、同样与 Tailwind 冲突。

**结论:** 同 rem 方案,**仅限纯 H5**。

---

### 3.4 Flex / Grid 弹性布局

严格说不是"响应式方案",而是**响应式的地基**。

- `flex-wrap: wrap`:元素自动换行;
- `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))`:自动根据容器宽度决定列数;
- `min-width: 0`、`flex: 1` 等技巧天然支持不同宽度;

```scss
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
```

上面一行 CSS,就能让卡片在 PC 上 4~5 列、平板 2~3 列、手机 1~2 列,**无需任何媒体查询**。

**结论:** 必选项,所有方案都应该用。但极端断点下仍需媒体查询配合(比如 PC 用侧栏+内容,H5 用顶部 Tab)。

---

### 3.5 容器查询(Container Queries)

**原理:** 不再基于视口,而是基于**组件所在容器的宽度**响应。这样一个组件放在侧边栏(窄)和放在主区域(宽)可以自动切换布局,组件复用性极强。

```scss
.card-wrapper {
  container-type: inline-size;
}

.card {
  display: flex;
  flex-direction: column;

  @container (min-width: 480px) {
    flex-direction: row;
  }
}
```

**优点**

- 组件真正"自适应",无需关心外部视口;
- 与组件化思路契合;
- 原生 CSS,无 JS 开销。

**缺点**

- 兼容性:Chrome 105+(2022)、Safari 16+(2022)。对主流浏览器 OK,但老设备/老版本 UC/QQ 浏览器仍有风险,H5 场景需留意;
- 心智模型与媒体查询不同,需学习。

**结论:** **作为媒体查询的补充**,用于可被复用到多种宽度容器中的组件(卡片、侧栏图表等)。本项目若要考虑老机型,建议媒体查询为主、容器查询选配。

---

### 3.6 条件渲染(两套组件 / 两套路由)

当 PC 与 H5 的 **DOM 结构 / 交互范式差异极大**(PC 侧栏导航 + 表格 vs H5 底部 Tab + 卡片流),光靠 CSS 很难收敛,此时直接在组件层面分叉。

思路示意(伪代码):

```tsx
// 通过 matchMedia 判断当前是否小屏
const isMobile = useIsMobile(); // hook 内部封装 matchMedia 监听

// 布局层按端切换
return isMobile ? <MobileLayout /> : <AdminLayout />;

// 差异极大的页面也可以整页切换
return isMobile ? <ImageListMobile /> : <ImageListDesktop />;
```

如果差异大到连导航都不同,还可以在路由配置层面走两套路由表。

**优点**

- 两端可以各自极致优化(交互、动画、性能);
- 代码分层清晰,互不打扰。

**缺点**

- 包体增大(两套组件都会被打包,除非路由级懒加载);
- 状态、业务逻辑要抽到 hooks/stores 层共享,否则容易两边重复实现、漂移;
- SSR 场景下 UA 判断和 `matchMedia` 判断要小心不一致(本项目是纯 CSR,问题不大)。

**结论:** **只在"布局容器级"或"差异极大的页面"使用**,不要滥用到每个组件。

---

### 3.7 混合方案(推荐)

现实里,上述方案**不是二选一,而是分层使用**:

```
┌──────────────────────────────────────────────────────────┐
│ 布局层(AdminLayout vs MobileLayout)                     │
│    → 条件渲染(useIsMobile 切换顶级布局)                 │
├──────────────────────────────────────────────────────────┤
│ 页面骨架层(PageHeader / Toolbar / Content)             │
│    → 媒体查询(SCSS mixin / Tailwind 前缀)调整           │
├──────────────────────────────────────────────────────────┤
│ 组件内部层(ImageCard / FormItem)                        │
│    → Flex/Grid + 媒体查询,必要时容器查询                │
├──────────────────────────────────────────────────────────┤
│ 主题 / 尺寸 token 层                                     │
│    → CSS Variables 按断点切换(间距、圆角、字号)         │
└──────────────────────────────────────────────────────────┘
```

关键 CSS Variables 按断点切换的示例:

```scss
// src/styles/variables.scss
:root {
  --spacing-page: 16px;
  --radius-card: 8px;
  --font-size-title: 16px;
}

@media (min-width: 1024px) {
  :root {
    --spacing-page: 32px;
    --radius-card: 12px;
    --font-size-title: 20px;
  }
}
```

组件里直接用变量,**组件代码不再感知断点**:

```scss
.card {
  padding: var(--spacing-page);
  border-radius: var(--radius-card);
}
```

这种写法和本项目现有的**主题 token + CSS Variables** 思路一脉相承,侵入性小、迁移平滑。

---

## 四、本项目推荐方案

结合项目现状(`React 19 + Vite + TailwindCSS v4 + SCSS Modules + CSS Variables + AntD v6 + 中后台图片管理`),推荐:

### 主方案:媒体查询 + Flex/Grid + 条件渲染(布局层) + CSS Variables

具体到每一层:

1. **断点体系**(统一口径,写入 `src/styles/breakpoints.scss`):
   - `mobile`:`< 768px`
   - `tablet`:`768px ~ 1023px`
   - `desktop`:`≥ 1024px`
   - `wide`:`≥ 1440px`
   - 同时保持和 Tailwind 断点(`md/lg/xl`)对齐,两边都能用。

2. **布局容器**:
   - 保留当前 `AdminLayout`(PC 侧栏布局);
   - 新增 `MobileLayout`(顶部标题栏 + 底部 Tab 导航 + Drawer 菜单);
   - 通过 `useIsMobile()` hook 在 `RootLayout` 里条件渲染切换。

3. **页面 / 组件**:
   - **复用同一个页面组件**(如 `pages/images/index.tsx`);
   - 内部用 Flex/Grid + 媒体查询做响应式;
   - AntD 组件调用层面按需用 `isMobile` 切形态(如 `Table` → `List`、`Modal` → `Drawer`)。

4. **Ant Design 配合**:
   - H5 场景下优先使用 `List`、`Drawer`、`Popup`、`Picker`、`Segmented` 等移动友好组件;
   - `Modal` 可在 H5 改为 `Drawer placement="bottom"`;
   - `ConfigProvider` 可按 `isMobile` 调整 `theme.token`(如 `controlHeight`、`borderRadius`)。

5. **尺寸 token**:关键间距、字号、圆角走 CSS 变量,在 `:root` 中按断点切换,组件内部不再重复媒体查询。

6. **暂不采用 rem/vw 等比缩放方案**——会与 Tailwind、AntD 冲突,且 PC 端拉伸体验差。

### 为什么是这套组合?

- **成本最低**:增量式改造,不动现有 Tailwind/SCSS 体系;
- **心智清晰**:布局层走条件渲染,组件层走 CSS,职责分明;
- **可演进**:后续可渐进引入容器查询,或抽独立 H5 包;
- **SSR/CSR 都友好**(本项目是 CSR,无额外成本)。

---

## 五、改造思路参考

> 仅作思路梳理,不涉及具体代码实现。具体落地以后续评审为准。

大致可以分成四个层次去考虑:

1. **基础设施层**
   - 统一一套断点语义(与 Tailwind 对齐),并提供一组 SCSS mixin 供组件使用;
   - 提供一个"端判断"的 hook(基于 `matchMedia`),供布局和少数需要条件渲染的组件使用;
   - 检查 `index.html` 中 `viewport` meta 是否到位,必要时考虑 iOS 安全区(`env(safe-area-inset-*)`)。

2. **主题 / 尺寸 token 层**
   - 把"间距、字号、组件高度、圆角"等关键尺寸抽到 CSS 变量中;
   - 在 `:root` 里按断点切换这些变量,组件内部尽量只消费变量、不重复写媒体查询。

3. **布局层**
   - PC 继续沿用现有 `AdminLayout`(侧栏 + 顶栏);
   - H5 形态差异较大,建议独立一个 `MobileLayout`(顶栏 + Drawer 菜单 + 底部 Tab);
   - 在 Root 入口处按"端判断"结果条件渲染。

4. **页面 / 组件层**
   - 绝大多数页面只需要在同一个组件里,通过 Flex/Grid + 媒体查询响应;
   - AntD 组件在 H5 下按需"换形态":`Modal → Drawer`、`Table → List`、`Popover → Popup` 等;
   - 登录、详情、预览这类页面,多数时候改几个断点下的宽度/内边距即可,不用拆组件。

### 改造优先级建议

- 高:布局壳(AdminLayout / MobileLayout)、登录页、图片列表、图片预览;
- 中:设置、用户管理等次要页面;
- 低:仅 PC 使用的后台专属页面(可暂不响应式,仅保证在 H5 上可访问)。

### 验收口径

- Chrome DevTools 设备模拟覆盖典型尺寸(如 iPhone 14 / iPad / 1440 桌面);
- 真机抽测 iOS Safari 与微信内置浏览器(H5 常见入口)。

---

## 六、常见坑与避雷

1. **不要混用 rem 缩放 + Tailwind**:二者都吃 `html` 的 `font-size`,改根字体会让 Tailwind 的尺寸全部变形。
2. **`100vh` 在移动端 Safari 有坑**:地址栏会动。优先用 `100dvh` / `100svh`,或 `min-height: -webkit-fill-available;`。
3. **点击态**:H5 记得处理 `:active`,必要时移除 300ms 点击延迟(已有 `touch-action: manipulation` 或 `<meta viewport>` 含 `user-scalable=no` 可缓解,不建议禁用缩放)。
4. **图片/表格溢出**:H5 下表格优先改为纵向卡片,避免横向滚动体验差。
5. **避免在高频渲染组件里调用 `window.innerWidth`**:统一经由 `matchMedia` 监听,别每次渲染读取。
6. **AntD Modal 在 H5 上**:宽度默认 520px,要么 `width="90vw"`,要么换 Drawer/Popup。
7. **字号最小值**:移动端 Chrome 对 `<12px` 有最小字号限制(不同平台策略不一),避免使用 10px 以下字号。
8. **Hover 依赖**:PC 的 `:hover` 在触屏上会"粘住",用 `@media (hover: hover)` 包裹只在真有鼠标的环境生效。

```scss
.card {
  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
    }
  }
}
```

---

## 七、参考资料

- MDN: [Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- MDN: [CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries)
- web.dev: [Designing for the viewport](https://web.dev/articles/viewport)
- TailwindCSS: [Responsive Design](https://tailwindcss.com/docs/responsive-design)
- Ant Design Mobile 作为 H5 专用组件库的选型参考(本项目暂不引入,仅做备选)。

---

> 文档版本 v1.0 · 本文仅做方案调研与示例说明,不含具体实现代码。如有调整建议,欢迎在评审中讨论。
