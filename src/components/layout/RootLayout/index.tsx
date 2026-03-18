import { Outlet, ScrollRestoration } from 'react-router-dom';
import { AliveScope } from 'react-activation';
import { NavigationProgress } from '@/components/NavigationProgress';
import { useScrollToTop } from '@/router/hooks/useScrollToTop';

/**
 * 根布局：包裹所有路由，挂载全局顶部进度条与滚动恢复
 * AliveScope 必须位于 Router 内部，否则 KeepAlive 缓存的组件无法使用 useLocation/useParams 等路由 hooks
 */
export function RootLayout() {
  useScrollToTop();

  return (
    <AliveScope>
      <ScrollRestoration />
      {/* 全局顶部进度条 */}
      <NavigationProgress />
      <Outlet />
    </AliveScope>
  );
}
