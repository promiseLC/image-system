import { useState } from 'react';
import Login from '@/pages/login';
import LoginTwo from '@/pages/loginTwo';

/**
 * /login 路由：随机展示玻璃风登录页或 three.js 登录页（进入页面时二选一，刷新可换）
 */
export function LoginRandom() {
  const [useThree] = useState(() => Math.random() < 0.5);

  return useThree ? <LoginTwo /> : <Login />;
}
