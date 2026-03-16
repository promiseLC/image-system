import type { LoaderFunctionArgs } from 'react-router-dom';
import type { RouteHandle } from './types';

/**
 * 纯路由定义（无 React 依赖）
 * 作为唯一数据源：routes 从此合并 element，AdminLayout 按需从此生成菜单
 */
export interface RouteDefinition {
  path?: string;
  index?: boolean;
  handle?: RouteHandle;
  /** 组件路径，mergeDefinitionsToRoutes 通过 lazy(import(path)) 加载，无需组件映射 */
  component?: string;
  /** 路由级 loader，会覆盖 extra 中的 authLoader，可在此做数据预加载、缓存等 */
  loader?: (args: LoaderFunctionArgs) => Promise<unknown> | unknown;
  /** 路由级 revalidate 策略，覆盖默认行为以支持缓存等 */
  shouldRevalidate?: (args: { currentUrl: URL; nextUrl: URL; defaultShouldRevalidate: boolean }) => boolean;
  children?: RouteDefinition[];
}

/** 受保护路由（后台）定义 */
export const protectedRouteDefinitions: RouteDefinition[] = [
  {
    path: '/',
    component: '/src/components/layout/adminLayout/index.tsx',
    handle: {
      title: '图片管理系统',
      menu: { label: '根布局', hide: true },
      breadcrumb: '首页',
      keepAlive: false,
      auth: [],
      roles: [],
    },
    children: [
      {
        index: true,
        component: '/src/pages/home/index.tsx',
        handle: {
          title: '仪表盘 - 图片管理系统',
          menu: { label: '仪表盘', icon: 'DashboardOutlined', order: 0 },
          breadcrumb: '仪表盘',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'images',
        handle: {
          title: '图片管理 - 图片管理系统',
          menu: {
            label: '图片管理',
            icon: 'PictureOutlined',
            order: 1,
            parentKey: 'image',
          },
          breadcrumb: '图片管理',
          // breadcrumbHide: true,
          keepAlive: true,
          auth: [],
          roles: ['admin'],
        },
        children: [
          {
            index: true,
            component: '/src/pages/images/index.tsx',
            handle: {
              title: '图片列表 - 图片管理系统',
              menu: { label: '图片列表', icon: 'UnorderedListOutlined', order: 0 },
              breadcrumb: '图片列表',
              keepAlive: true,
              auth: [],
              roles: [],
            },
          },
          {
            path: 'detail/:id',
            component: '/src/pages/images/detail/index.tsx',
            handle: {
              title: '图片详情 - 图片管理系统',
              menu: { hide: true, label: '详情' },
              breadcrumb: '图片详情',
              animation: { type: 'slide-left', duration: 250 },
              keepAlive: false,
              auth: [],
              roles: [],
            },
          },
          {
            path: 'upload',
            component: '/src/pages/images/upload/index.tsx',
            handle: {
              title: '上传图片 - 图片管理系统',
              menu: { label: '上传图片', icon: 'UploadOutlined', order: 1 },
              breadcrumb: '上传图片',
              animation: { type: 'slide-right', duration: 200 },
              keepAlive: false,
              auth: [],
              roles: [],
            },
          },
          {
            path: 'trash',
            component: '/src/pages/images/trash/index.tsx',
            handle: {
              title: '回收站 - 图片管理系统',
              menu: { label: '回收站', icon: 'DeleteOutlined', order: 2 },
              animation: { type: 'zoom', duration: 200 },
              breadcrumb: '回收站',
              keepAlive: false,
              auth: [],
              roles: [],
            },
          },
        ],
      },

      {
        path: 'tags',
        component: '/src/pages/tags/index.tsx',
        handle: {
          title: '标签管理 - 图片管理系统',
          menu: { label: '标签管理', icon: 'TagsOutlined', order: 3 },
          breadcrumb: '标签管理',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'storage',
        component: '/src/pages/storage/index.tsx',
        handle: {
          title: '存储管理 - 图片管理系统',
          menu: { label: '存储管理', icon: 'CloudOutlined', order: 4 },
          breadcrumb: '存储管理',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'analytics',
        component: '/src/pages/analytics/index.tsx',
        handle: {
          title: '使用统计 - 图片管理系统',
          menu: { label: '使用统计', icon: 'BarChartOutlined', order: 5 },
          breadcrumb: '使用统计',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'logs',
        component: '/src/pages/logs/index.tsx',
        handle: {
          title: '操作日志 - 图片管理系统',
          menu: { label: '操作日志', icon: 'FileTextOutlined', order: 6 },
          breadcrumb: '操作日志',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'about',
        component: '/src/pages/about/index.tsx',
        handle: {
          title: '系统信息 - 图片管理系统',
          menu: { label: '系统信息', icon: 'InfoCircleOutlined', order: 7 },
          breadcrumb: '系统信息',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'settings',
        component: '/src/pages/setting/index.tsx',
        handle: {
          title: '系统设置 - 图片管理系统',
          menu: { label: '系统设置', icon: 'SettingOutlined', order: 100 },
          breadcrumb: '系统设置',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: 'profile',
        component: '/src/pages/profile/index.tsx',
        handle: {
          title: '个人中心 - 图片管理系统',
          menu: { label: '个人中心', hide: true },
          breadcrumb: '个人中心',
          keepAlive: false,
          auth: [],
          roles: ['admin', 'user'],
        },
      },
      {
        path: '*',
        component: '/src/pages/notFound/index.tsx',
        handle: {
          title: '页面不存在 - 图片管理系统',
          menu: { label: '404', hide: true },
          breadcrumb: '404',
          breadcrumbHide: true,
          keepAlive: false,
          auth: [],
          roles: [],
        },
      },
    ],
  },
];
