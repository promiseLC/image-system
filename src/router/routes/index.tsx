import { lazy, Suspense } from 'react';
import type { AppRouteObject } from '../types';
import { protectedRouteDefinitions } from '../routeDefinitions';
import type { RouteDefinition } from '../routeDefinitions';
import { authLoader, loginRedirectLoader } from '../guards/authLoader';
import RouteErrorBoundary from '@/components/RouteErrorBoundary';
import Login from '@/pages/login';
import SuspenseFallback from '@/components/suspenseFallback';
import { canAccessRoute } from '@/router/utils/routeAccess';

/**
 * 通过 import.meta.glob 预扫描页面/布局，路径即 key
 * 添加新页面时只需在 routeDefinitions 中写 component 路径，无需在此维护
 */
const ROUTE_MODULES = import.meta.glob<{ default: React.ComponentType }>([
  '@/pages/**/index.tsx',
  '@/components/layout/**/index.tsx',
]);

function getLazyComponent(componentPath: string) {
  const loader = ROUTE_MODULES[componentPath];
  if (!loader) {
    /* eslint-disable-next-line no-console */
    console.warn(`[router] 未找到组件: ${componentPath}`);
    return null;
  }
  return lazy(loader);
}

function withSuspense(Component: React.LazyExoticComponent<React.ComponentType> | null) {
  if (!Component) return null;
  return (
    <Suspense fallback={<SuspenseFallback />}>
      <Component />
    </Suspense>
  );
}

/** 将纯路由定义合并为完整路由配置，并按 handle.roles / handle.auth 过滤 */
function mergeDefinitionsToRoutes(defs: RouteDefinition[], extra?: Partial<AppRouteObject>): AppRouteObject[] {
  return defs.filter(canAccessRoute).map((def) => {
    const route: AppRouteObject = {
      path: def.path,
      index: def.index,
      handle: def.handle,
      ...(extra ?? {}),
    };

    if (def.component) {
      const LazyComponent = getLazyComponent(def.component);
      if (LazyComponent) {
        route.element = withSuspense(LazyComponent);
      }
    }

    if (def.children?.length) {
      route.children = mergeDefinitionsToRoutes(def.children);
    }

    return route;
  });
}

/** 公共路由 - 无需登录 */
export const publicRoutes: AppRouteObject[] = [
  {
    path: '/login',
    element: <Login />,
    loader: loginRedirectLoader,
    handle: {
      title: '登录',
      menu: { label: '登录', hide: true },
      breadcrumb: '登录',
      keepAlive: false,
      auth: [],
      roles: [],
    },
  },
];

/** 受保护路由 - 从 routeDefinitions 合并生成 */
export const protectedRoutes: AppRouteObject[] = mergeDefinitionsToRoutes(protectedRouteDefinitions, {
  loader: authLoader,
  errorElement: <RouteErrorBoundary />,
});
