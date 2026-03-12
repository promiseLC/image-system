import { useEffect } from 'react';
import { useMatches } from 'react-router-dom';

interface RouteHandle {
  title?: string;
}

/**
 * 根据当前匹配路由的 handle.title 同步 document.title
 * 当 handle.title 存在时更新，不存在则不更改
 * 从匹配链末尾向前查找，优先使用叶子路由的 title
 */
export function useRouteTitle(): void {
  const matches = useMatches();

  useEffect(() => {
    for (let i = matches.length - 1; i >= 0; i--) {
      const handle = (matches[i] as { handle?: RouteHandle })?.handle;
      if (handle?.title) {
        document.title = handle.title;
        return;
      }
    }
  }, [matches]);
}
