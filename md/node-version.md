# Node 版本限制说明

本文档说明本项目如何限制 Node.js 版本，以及相关配置的作用。

## 版本要求

本项目要求 **Node.js 20.19 及以上版本**。

---

## 配置说明

### 1. package.json - engines 字段

**文件路径：** `package.json`

**添加的代码：**

```json
"engines": {
  "node": ">=20.19.0"
}
```

**作用：**

- 声明项目运行所需的 Node 版本范围
- `>=20.19.0` 表示需要 20.19.0 或更高版本
- npm、pnpm、yarn 等包管理器会读取此字段，用于版本校验和提示
- 部分托管平台（如 Vercel、Netlify）会据此选择构建环境

---

### 2. .npmrc - engine-strict

**文件路径：** `.npmrc`（项目根目录）

**添加的代码：**

```
engine-strict=true
```

**作用：**

- 启用「引擎严格模式」
- 当执行 `pnpm install` 或 `npm install` 时，若当前 Node 版本不满足 `package.json` 中 `engines` 的要求，安装会**直接失败**并报错
- 避免在错误版本下安装依赖、构建，减少潜在兼容性问题
- 未设置时，包管理器通常只给出警告而不中断安装

---

### 3. .nvmrc - 版本管理器配置文件

**文件路径：** `.nvmrc`（项目根目录）

**添加的代码：**

```
20.19
```

**作用：**

- 供 **nvm**（Node Version Manager）或 **fnm**（Fast Node Manager）等工具使用
- 在项目根目录执行 `nvm use` 或 `fnm use` 时，会自动切换到此处指定的版本
- 方便团队成员统一使用相同 Node 版本，无需手动记忆版本号
- 仅作为开发辅助配置，不参与包管理器的版本校验

---

## 使用说明

### 检查当前 Node 版本

```bash
node -v
```

### 若使用 nvm 或 fnm

在项目根目录执行：

```bash
nvm use    # nvm
# 或
fnm use    # fnm
```

### 版本不符时的表现

执行 `pnpm install` 时，若 Node 版本低于 20.19，会看到类似错误：

```
ERR_PNPM_ENGINES_UNSUPPORTED_ENGINE  Unsupported engine...
```

此时需要升级 Node 至 20.19 或更高版本后再进行安装。
