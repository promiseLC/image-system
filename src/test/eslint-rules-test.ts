/**
 * ESLint 规则验证测试文件
 * 本文件故意违反各项规则，用于验证 eslint.config.js 中的规则是否生效
 */

// 合法示例（不应报错）
const validConst = 'single quotes ok';

function validParams(a: number, b: number, c: number) {
  return a + b + c;
}

export { validConst, validParams };
