# 图片管理系统

<div align="center">

企业级图片管理系统，基于 React + TypeScript + Vite 构建

[功能特性](#-功能特性) • [快速开始](#-快速开始) • [项目结构](#-项目结构) • [开发规范](#-开发规范) • [部署](#-部署)

</div>

## 📋 项目简介

这是一个功能完整的图片管理系统，支持图片的上传、查看、管理，并提供灵活的权限控制和主题定制功能。

### 技术栈

| 类别        | 技术选型                           | 说明                   |
| ----------- | ---------------------------------- | ---------------------- |
| 核心框架    | React + TypeScript                 | 最新特性，完整类型支持 |
| 构建工具    | Vite                               | 极速的开发服务器       |
| 路由        | React Router v7                    | 支持数据路由和懒加载   |
| 状态管理    | Zustand                            | 轻量高效               |
| 数据缓存    | TanStack Query                     | 服务端状态管理         |
| UI 组件     | Ant Design                         | 企业级组件库           |
| 样式方案    | SCSS + TailwindCSS + CSS Variables | 灵活的主题定制         |
| HTTP 客户端 | Axios                              | 请求拦截、取消         |
| 动画        | Framer Motion                      | 路由切换动画           |
| 工具库      | Day.js + classnames                | 日期处理、条件类名     |

## ✨ 功能特性

### 🖼️ 图片管理

- 图片上传（OSS直传）
- 图片列表（网格/列表视图）
- 图片预览（大图模式）
- 图片基础操作（重命名/移动/删除）
- 回收站机制
- 批量操作

### 🔐 权限系统

- 基于角色的访问控制（RBAC）
- 路由级权限控制
- 按钮级权限控制
- 可配置的权限点
- 管理员/普通用户双角色
- 操作审计日志

### 🎨 主题系统

- 明亮/暗黑模式切换
- 8种预设主题色
- 主题色持久化
- 动态 CSS 变量

### ⚡ 性能优化

- 路由懒加载
- 图片懒加载
- React Query 数据缓存
- 虚拟滚动
- 错误边界处理

## 🚀 快速开始

### 环境要求

- Node.js 20.19+
- pnpm（强制）

### 安装步骤

```bash

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 📁 项目结构

```
src/
├── apis/                    # API 请求层
│   ├── auth.ts
│   ├── images.ts
│   └── client.ts
├── assets/                   # 静态资源
├── components/               # 公共组件
│   ├── common/               # 通用组件
│   ├── layout/               # 布局组件
│   ├── permission/           # 权限组件
│   └── image/                # 图片组件
├── hooks/                    # 自定义 Hooks
│   ├── useAuth.ts
│   ├── useTheme.ts
│   └── usePermission.ts
├── pages/                    # 页面组件
│   ├── login/
│   ├── dashboard/
│   ├── images/
│   └── settings/
├── routes/                   # 路由配置
│   ├── index.tsx
│   └── PrivateRoute.tsx
├── stores/                   # Zustand 状态管理
│   ├── authStore.ts
│   ├── themeStore.ts
│   └── permissionStore.ts
├── styles/                   # 全局样式
│   ├── themes/
│   │   ├── light.scss
│   │   └── dark.scss
│   ├── global.scss
│   └── variables.scss
├── types/                    # TypeScript 类型
├── utils/                    # 工具函数
├── App.tsx
└── main.tsx
```

## 🛠️ 开发规范

### 代码规范

- **ESLint** - 风格指南
- **Prettier** - 统一代码格式化
- **Husky** + **lint-staged** - Git 提交前检查

### Git 提交规范

```
<type>(<scope>): <subject>

  feat:     新功能
  fix:      修复bug
  docs:     文档更新
  style:    代码格式调整
  refactor: 代码重构
  test:     测试相关
  chore:    构建过程或辅助工具变动
```

示例：

```bash
feat(image): 添加图片批量上传功能
fix(auth): 修复token过期后跳转登录页的问题
```

### 命名规范

- **组件文件**：`PascalCase.tsx`
- **工具文件**：`camelCase.ts`
- **样式文件**：`kebab-case.module.scss`
- **常量**：`UPPER_SNAKE_CASE`
- **类型接口**：`I` + `PascalCase`

## 🎨 样式方案

### 技术组合

- **SCSS** - 复杂样式逻辑
- **TailwindCSS** - 原子化样式
- **CSS Variables** - 动态主题切换
- **CSS Modules** - 类名隔离

### CSS Modules 示例

```scss
// ImageGrid.module.scss
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  .item {
    @apply rounded-lg overflow-hidden;
    border: 1px solid var(--border-base);
  }
}
```

```tsx
// ImageGrid.tsx
import styles from './ImageGrid.module.scss';
import classNames from 'classnames';

export const ImageGrid = ({ images }) => {
  return (
    <div className={styles.grid}>
      {images.map((image) => (
        <div key={image.id} className={styles.item}>
          <ImageCard image={image} />
        </div>
      ))}
    </div>
  );
};
```

## 📈 性能优化

- 路由懒加载 + 代码分割
- 图片懒加载
- React Query 数据缓存
- 虚拟滚动（react-window）
- 错误边界处理
- 防抖/节流处理

### 构建命令

```bash
# 构建生产版本
pnpm build

# 构建产物在 dist 目录
```

## 📝 后续规划

- Storybook 组件文档

## 📄 许可证

MIT © 2024

---

<div align="center">
  <sub>Built with ❤️ by Your Team</sub>
</div>
