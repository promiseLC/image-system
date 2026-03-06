# ESLint 配置说明

本文档说明本项目 `eslint.config.js` 的完整配置结构及自定义规则。

---

## 配置概览

### 基础配置

| 配置项          | 值                | 说明                    |
| --------------- | ----------------- | ----------------------- |
| `files`         | `**/*.{ts,tsx}`   | 检查 `.ts`、`.tsx` 文件 |
| `ecmaVersion`   | `2020`            | ES 语法版本             |
| `globals`       | `globals.browser` | 浏览器环境全局变量      |
| `globalIgnores` | `['dist']`        | 忽略 `dist` 构建目录    |

### 扩展与插件

| 扩展                                  | 说明                       |
| ------------------------------------- | -------------------------- |
| `js.configs.recommended`              | ESLint 推荐规则            |
| `tseslint.configs.recommended`        | TypeScript ESLint 推荐规则 |
| `reactHooks.configs.flat.recommended` | React Hooks 规则           |
| `reactRefresh.configs.vite`           | Vite + React Refresh 规则  |
| `eslintConfigPrettier`                | 关闭与 Prettier 冲突的规则 |

### 解析器配置

```javascript
parser: tseslint.parser,
parserOptions: {
  project: ['./tsconfig.app.json', './tsconfig.node.json'],
  tsconfigRootDir: import.meta.dirname,
}
```

使用 TypeScript 解析器，并基于 `tsconfig` 进行类型感知检查。

---

## 自定义规则

| 规则                                | 级别  | 说明                                       |
| ----------------------------------- | ----- | ------------------------------------------ |
| `no-console`                        | warn  | 禁止使用 `console`，调试代码应在提交前移除 |
| `quotes`                            | error | 必须使用单引号，与 Prettier 保持一致       |
| `no-var`                            | error | 禁止使用 `var`，统一使用 `let` 或 `const`  |
| `prefer-const`                      | warn  | 若变量不会被重新赋值，应使用 `const`       |
| `max-len`                           | warn  | 单行代码最大 120 字符                      |
| `max-params`                        | warn  | 函数参数最多 5 个                          |
| `@typescript-eslint/no-unused-vars` | warn  | 未使用的变量或参数应移除，`_` 开头可忽略   |

---

## 规则详解

### no-console (warn)

生产代码中不应保留 `console` 输出。

```typescript
console.log('debug'); // ⚠️ 警告
```

### quotes (error)

字符串必须使用单引号。

```typescript
const a = 'double'; // ❌ 错误
const b = 'single'; // ✅ 正确
```

### no-var (error)

禁止使用 `var`，改用 `let` 或 `const`。

```typescript
var x = 1; // ❌ 错误
let y = 2; // ✅ 正确（需重新赋值时）
const z = 3; // ✅ 正确
```

### prefer-const (warn)

变量未重新赋值时应使用 `const`。

```typescript
let count = 0; // ⚠️ 应改用 const
const total = 10; // ✅ 正确
```

### max-len (warn)

单行不超过 120 字符，URL、字符串字面量、模板字符串不计入。

```javascript
// 配置
'max-len': ['warn', {
  code: 120,
  ignoreUrls: true,
  ignoreStrings: true,
  ignoreTemplateLiterals: true
}]
```

### max-params (warn)

函数参数最多 5 个。

```typescript
function fn(a, b, c, d, e, f) {} // ⚠️ 6 个参数
```

### @typescript-eslint/no-unused-vars (warn)

未使用变量需移除，以 `_` 开头的参数可忽略。

```typescript
const unused = 1; // ⚠️ 未使用
function fn(_skip) {} // ✅ 下划线开头可忽略
```

---

## 使用方式

### 检查全部

```bash
pnpm exec eslint .
```

### 检查指定文件

```bash
pnpm exec eslint src/App.tsx
```

### 自动修复

```bash
pnpm exec eslint . --fix
```

### 规则验证

测试文件 `src/test/eslint-rules-test.ts` 故意违反各规则，用于验证配置是否生效。

---

## 与 Prettier 集成

`eslintConfigPrettier` 放在 `extends` 末尾，用于关闭与 Prettier 冲突的 ESLint 规则：

- **Prettier**：负责格式化（引号、缩进、换行等）
- **ESLint**：负责代码质量与最佳实践

二者互补，可同时使用。
