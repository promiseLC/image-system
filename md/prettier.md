# Prettier 代码格式化说明

本文档说明本项目如何通过 Prettier 自动格式化代码，以及与 ESLint 的集成方式。

## 功能概述

- **Prettier**：统一代码风格，自动格式化
- **eslint-config-prettier**：关闭与 Prettier 冲突的 ESLint 规则，避免双重格式化
- **语句结尾分号**：通过 `semi: true` 强制在语句结尾添加 `;`

---

## 配置说明

### 1. .prettierrc - 格式化规则

**文件路径：** `.prettierrc`（项目根目录）

**配置内容：**

```json
{
  "semi": true,
  "singleQuote": true,
  "printWidth": 120,
  "trailingComma": "es5"
}
```

**各选项作用：**

| 选项            | 值      | 说明                                        |
| --------------- | ------- | ------------------------------------------- |
| `semi`          | `true`  | 语句结尾添加分号                            |
| `singleQuote`   | `true`  | 使用单引号，与 ESLint 保持一致              |
| `printWidth`    | `120`   | 每行最大 120 字符，与 ESLint `max-len` 对应 |
| `trailingComma` | `"es5"` | 在 ES5 支持的场合添加尾逗号（对象、数组等） |

---

### 2. .prettierignore - 忽略文件

**文件路径：** `.prettierignore`（项目根目录）

**配置内容：**

```
dist
node_modules
*.min.js
```

**作用：**

- 不格式化构建产物 `dist`、依赖目录 `node_modules` 以及压缩文件
- 减少无意义的格式化和潜在问题

---

### 3. eslint.config.js - 与 ESLint 集成

**文件路径：** `eslint.config.js`

**关键配置：**

```javascript
import eslintConfigPrettier from 'eslint-config-prettier';

// extends 中需将 eslintConfigPrettier 放在最后
extends: [
  // ... 其他配置
  eslintConfigPrettier,
],
```

**作用：**

- `eslint-config-prettier` 会关闭与 Prettier 冲突的 ESLint 规则（如 `quotes`、`indent` 等）
- 格式化由 Prettier 统一处理，ESLint 专注代码质量检查
- 必须放在 `extends` 末尾，才能正确覆盖冲突规则

---

### 4. package.json - 格式化脚本

**文件路径：** `package.json`

**添加的脚本：**

```json
"format": "prettier --write .",
"format:check": "prettier --check ."
```

---

## 使用说明

### 格式化全部代码

```bash
pnpm run format
```

会对项目内所有支持的文件执行格式化并写入修改。

### 检查格式（不修改）

```bash
pnpm run format:check
```

适用于 CI，仅检查是否符合 Prettier 规则，不符合时返回非零退出码。

### 格式化指定文件

```bash
pnpm exec prettier --write src/App.tsx
```

### 格式化指定目录

```bash
pnpm exec prettier --write "src/**/*.{ts,tsx}"
```

---

## 编辑器集成

建议在 VS Code / Cursor 中：

1. 安装 **Prettier - Code formatter** 扩展
2. 将默认格式化工具设为 Prettier
3. 启用「保存时自动格式化」（Format On Save）

这样在保存文件时会自动按 Prettier 规则格式化，保持风格一致。
