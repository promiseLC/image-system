# Git 提交校验配置说明

本文档说明本项目使用 Husky 实现的 Git 提交前校验机制。

## 功能概览

| 功能               | 工具       | 触发时机   |
| ------------------ | ---------- | ---------- |
| 代码格式化         | Prettier   | pre-commit |
| 代码检查（无警告） | ESLint     | pre-commit |
| Commit 消息规范    | Commitlint | commit-msg |

---

## 1. pre-commit：代码质量校验

提交前自动执行：

1. **Prettier 格式化**：对暂存的文件执行 `prettier --write`
2. **ESLint 检查**：`eslint --fix --max-warnings 0`，有任意警告即阻止提交

### 涉及文件类型

- `*.{ts,tsx,js,jsx}`：Prettier + ESLint
- `*.{json,css,md}`：仅 Prettier

### 说明

- 使用 `lint-staged` 只对暂存文件执行，提升速度
- `--max-warnings 0` 确保代码无 ESLint 警告才能提交

---

## 2. commit-msg：Commit 消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>
```

### type 类型

| 类型     | 说明      |
| -------- | --------- |
| feat     | 新功能    |
| fix      | 修复 bug  |
| docs     | 文档变更  |
| style    | 代码格式  |
| refactor | 重构      |
| perf     | 性能优化  |
| test     | 测试相关  |
| chore    | 构建/工具 |

### 示例

```
feat(ui): 添加登录按钮
fix(api): 修复请求超时问题
docs: 更新 README 安装说明
chore: 升级依赖版本
```

### 规则

- type 必须小写
- subject 不能为空
- subject 结尾不能有句号
- 总长度不超过 100 字符

---

## 跳过校验（慎用）

```bash
# 跳过 pre-commit（不推荐）
git commit --no-verify -m "message"

# 跳过 commit-msg（不推荐）
git commit --no-verify -m "message"
```

---

## 相关文件

| 文件/目录                       | 说明                |
| ------------------------------- | ------------------- |
| `.husky/pre-commit`             | pre-commit 钩子脚本 |
| `.husky/commit-msg`             | commit-msg 钩子脚本 |
| `commitlint.config.js`          | Commitlint 配置     |
| `package.json` 中 `lint-staged` | lint-staged 配置    |
