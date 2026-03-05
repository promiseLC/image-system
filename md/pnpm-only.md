# 仅限 pnpm 安装依赖说明

本文档说明本项目如何限制只能使用 pnpm 安装依赖，以及相关配置的作用。

## 限制要求

本项目**只能使用 pnpm** 安装依赖，使用 npm 或 yarn 将被拦截。

---

## 配置说明

### 1. package.json - preinstall 脚本

**文件路径：** `package.json`

**添加的代码：**

```json
"scripts": {
  "preinstall": "node scripts/preinstall.js",
  ...
}
```

**作用：**

- `preinstall` 是 npm/pnpm 的生命周期钩子，会在执行 `install` 之前自动运行
- 无论使用何种包管理器，只要执行安装命令，都会先触发此脚本
- 通过执行 `scripts/preinstall.js`，在安装前进行包管理器校验

---

### 2. scripts/preinstall.js - 校验脚本

**文件路径：** `scripts/preinstall.js`

**文件内容：**

```javascript
/**
 * 限制项目只能使用 pnpm 安装依赖
 * 在 preinstall 阶段执行，非 pnpm 时退出并提示
 */
const execPath = process.env.npm_execpath || '';

if (!execPath.includes('pnpm')) {
  console.error('\n此项目只能使用 pnpm 安装依赖。\n请运行: pnpm install\n');
  process.exit(1);
}
```

**作用：**

- `process.env.npm_execpath` 为包管理器在安装时注入的环境变量，指向当前使用的可执行文件路径
- 若路径中包含 `pnpm`，则认定为使用 pnpm，允许继续
- 若不包含（即使用 npm、yarn 等），则输出提示信息并 `process.exit(1)` 终止安装
- 确保团队统一使用 pnpm，避免因包管理器差异导致的 lock 文件冲突和依赖不一致

---

## 使用说明

### 正确安装方式

```bash
pnpm install
```

### 错误使用时的表现

使用 `npm install` 或 `yarn` 时，会在安装开始前报错并终止：

```
此项目只能使用 pnpm 安装依赖。
请运行: pnpm install
```

### 未安装 pnpm 时

可通过以下方式安装 pnpm：

```bash
npm install -g pnpm
# 或
corepack enable
corepack prepare pnpm@latest --activate
```
