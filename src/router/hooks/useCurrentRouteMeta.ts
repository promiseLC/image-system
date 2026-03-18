import { useMatches } from 'react-router-dom';
import type { RouteHandle } from '../types';

interface MatchWithHandle {
  pathname: string;
  params: Record<string, string | undefined>;
  handle?: RouteHandle;
}

/**
 * 从当前匹配路由链中获取叶子路由的 handle（title、breadcrumb、keepAlive、menu）
 * 用于多标签页的标题展示、缓存判断与 Tab 过滤（menu.hide 的路由不加入标签）
 */
export function useCurrentRouteMeta(): {
  /** 页面标题，用于 document.title */
  title: string;
  /** 面包屑名称，用于 Tab 标签展示（短名称） */
  breadcrumbLabel: string;
  keepAlive?: boolean;
  menu?: { hide?: boolean };
} | null {
  const matches = useMatches() as MatchWithHandle[];
  const leaf = [...matches].reverse().find((m: MatchWithHandle) => m.handle);
  if (!leaf?.handle) return null;

  const title =
    typeof leaf.handle.breadcrumb === 'function'
      ? leaf.handle.breadcrumb(leaf.params)
      : (leaf.handle.title ?? leaf.handle.breadcrumb ?? leaf.pathname);

  const breadcrumbLabel =
    typeof leaf.handle.breadcrumb === 'function'
      ? leaf.handle.breadcrumb(leaf.params)
      : (leaf.handle.breadcrumb ?? leaf.handle.title ?? leaf.pathname);

  return {
    title: String(title),
    breadcrumbLabel: String(breadcrumbLabel),
    keepAlive: leaf.handle.keepAlive,
    menu: leaf.handle.menu,
  };
}
