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
              breadcrumb: '回收站',
              keepAlive: false,
              auth: [],
              roles: [],
            },
          },
        ],
      },
      {
        path: 'settings',
        component: '/src/pages/setting/index.tsx',
        handle: {
          title: '系统设置 - 图片管理系统',
          menu: { label: '系统设置', icon: 'SettingOutlined', order: 2 },
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
