# ESLint 规则说明

本文档说明本项目 `eslint.config.js` 中配置的自定义规则及其用途。

## 规则概览

| 规则                                | 级别  | 说明                                       |
| ----------------------------------- | ----- | ------------------------------------------ |
| `no-console`                        | warn  | 禁止使用 `console`，调试代码应在提交前移除 |
| `quotes`                            | error | 必须使用单引号，与 Prettier 保持一致       |
| `no-var`                            | error | 禁止使用 `var`，统一使用 `let` 或 `const`  |
| `prefer-const`                      | warn  | 若变量不会被重新赋值，应使用 `const`       |
| `max-len`                           | warn  | 单行代码最大 120 字符                      |
| `max-params`                        | warn  | 函数参数最多 5 个                          |
| `@typescript-eslint/no-unused-vars` | warn  | 未使用的变量或参数应移除                   |

---

## 规则详解

### 1. no-console

**级别：** warn

**说明：** 生产代码中不应保留 `console.log`、`console.warn` 等调试输出。

**示例：**

```typescript
console.log('debug'); // ⚠️ 触发警告
```

### 2. quotes

**级别：** error

**说明：** 字符串必须使用单引号，与 Prettier `singleQuote: true` 保持一致。

**示例：**

```typescript
const a = 'double'; // ❌ 错误
const b = 'single'; // ✅ 正确
```

### 3. no-var

**级别：** error

**说明：** 禁止使用 `var`，改用 `let` 或 `const` 以明确作用域。

**示例：**

```typescript
var x = 1; // ❌ 错误
let y = 2; // ✅ 正确（需重新赋值时）
const z = 3; // ✅ 正确（推荐）
```

### 4. prefer-const

**级别：** warn

**说明：** 若变量声明后从未被重新赋值，应使用 `const` 而非 `let`。

**示例：**

```typescript
let count = 0; // ⚠️ 应改用 const
const total = 10; // ✅ 正确
```

### 5. max-len

**级别：** warn

**说明：** 单行代码不超过 120 字符。以下内容不计入长度：

- URL
- 字符串字面量
- 模板字符串

**配置：**

```javascript
'max-len': ['warn', {
  code: 120,
  ignoreUrls: true,
  ignoreStrings: true,
  ignoreTemplateLiterals: true
}]
```

### 6. max-params

**级别：** warn

**说明：** 函数参数不得超过 5 个。参数过多时应考虑使用对象或拆分函数。

**示例：**

```typescript
function fn(a, b, c, d, e, f) {} // ⚠️ 6 个参数，触发警告
```

### 7. @typescript-eslint/no-unused-vars

**级别：** warn

**说明：** 未使用的变量或参数应移除。以 `_` 开头的参数可忽略（常用于占位）。

**示例：**

```typescript
const unused = 1; // ⚠️ 未使用
function fn(_skip) {} // ✅ 以下划线开头可忽略
```

---

**运行校验：**

```bash
pnpm exec eslint src/test/eslint-rules-test.ts
```

**自动修复（部分规则可修复）：**

```bash
pnpm exec eslint src/test/eslint-rules-test.ts --fix
```

---

## 与 Prettier 的关系

本项目使用 `eslint-config-prettier` 关闭与 Prettier 冲突的 ESLint 规则：

- 格式化由 Prettier 负责（引号、缩进、换行等）
- ESLint 专注代码质量和最佳实践

二者分工明确，可同时使用。
