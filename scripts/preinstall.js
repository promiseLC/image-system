/**
 * 限制项目只能使用 pnpm 安装依赖
 * 在 preinstall 阶段执行，非 pnpm 时退出并提示
 */
const execPath = process.env.npm_execpath || '';

if (!execPath.includes('pnpm')) {
  console.error('\n此项目只能使用 pnpm 安装依赖。\n请运行: pnpm install\n');
  process.exit(1);
}
