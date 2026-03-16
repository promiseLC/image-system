import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  PictureOutlined,
  UploadOutlined,
  DeleteOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  TagsOutlined,
  CloudOutlined,
  BarChartOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { RouteDefinition } from '../routeDefinitions';
import { canAccessRoute } from './routeAccess';

const ICON_MAP: Record<string, React.ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  PictureOutlined: <PictureOutlined />,
  UnorderedListOutlined: <UnorderedListOutlined />,
  UploadOutlined: <UploadOutlined />,
  DeleteOutlined: <DeleteOutlined />,
  SettingOutlined: <SettingOutlined />,
  TagsOutlined: <TagsOutlined />,
  CloudOutlined: <CloudOutlined />,
  BarChartOutlined: <BarChartOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  InfoCircleOutlined: <InfoCircleOutlined />,
};

function getIcon(iconName?: string | React.ReactNode): React.ReactNode | undefined {
  if (!iconName) return undefined;
  return typeof iconName === 'string' ? ICON_MAP[iconName] : iconName;
}

/**
 * 从路由结构构建侧边栏菜单项
 * 根据 handle.menu 过滤并排序，支持嵌套，可根据权限动态过滤
 */
export function buildMenuFromRoutes(routes: RouteDefinition[]): MenuProps['items'] {
  const items: MenuProps['items'] = [];
  const rootRoute = routes.find((r) => r.path === '/');
  const rootChildren = rootRoute?.children ?? [];

  const sorted = [...rootChildren]
    .filter(canAccessRoute)
    .sort((a, b) => (a.handle?.menu?.order ?? 999) - (b.handle?.menu?.order ?? 999));

  for (const route of sorted) {
    const path = route.path ? `/${route.path}` : '/';
    const menu = route.handle?.menu;

    if (!menu || menu.hide) continue;

    const nestedWithMenu =
      route.children?.filter((c) => canAccessRoute(c) && c.handle?.menu && !c.handle.menu.hide) ?? [];
    const hasNestedChildren = nestedWithMenu.length > 0;

    if (hasNestedChildren && route.children) {
      const childItems: MenuProps['items'] = route.children
        .filter((c) => canAccessRoute(c) && c.handle?.menu && !c.handle.menu.hide)
        .sort((a, b) => (a.handle?.menu?.order ?? 0) - (b.handle?.menu?.order ?? 0))
        .map((c) => {
          const childPath = c.path ? `${path}/${c.path}` : path;
          return {
            key: childPath,
            icon: getIcon(c.handle?.menu?.icon),
            label: c.handle?.menu?.label ?? c.handle?.title ?? childPath,
          };
        });

      const parentKey = menu.parentKey ?? path;
      items.push({
        key: parentKey,
        icon: getIcon(menu.icon),
        label: menu.label ?? route.handle?.title ?? path,
        children: childItems.length > 0 ? childItems : undefined,
      });
    } else {
      items.push({
        key: path,
        icon: getIcon(menu.icon),
        label: menu.label ?? route.handle?.title ?? path,
      });
    }
  }

  return items;
}

/**
 * 根据 pathname 从路由定义计算应展开的子菜单 key
 * 遍历有嵌套菜单的路由，若 pathname 在其路径下则展开
 */
export function getOpenKeysForPathname(routes: RouteDefinition[], pathname: string): string[] {
  const openKeys: string[] = [];
  const rootRoute = routes.find((r) => r.path === '/');
  const rootChildren = rootRoute?.children ?? [];

  function walk(parentPath: string, defs: RouteDefinition[]) {
    for (const def of defs) {
      const path = def.path ? `${parentPath}/${def.path}`.replace(/\/+/g, '/') : parentPath;
      const menu = def.handle?.menu;
      const nestedWithMenu = def.children?.filter((c) => c.handle?.menu && !c.handle.menu.hide) ?? [];

      if (menu && !menu.hide && nestedWithMenu.length > 0) {
        const menuKey = menu.parentKey ?? path;
        const pathPrefix = path === '/' ? path : `${path}/`;
        if (pathname === path || pathname.startsWith(pathPrefix)) {
          openKeys.push(menuKey);
        }
        if (def.children) {
          walk(path, def.children);
        }
      } else if (def.children?.length) {
        walk(path, def.children);
      }
    }
  }

  walk('/', rootChildren);
  return openKeys;
}
