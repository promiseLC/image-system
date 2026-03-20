import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import cn from 'classnames';
import { KeepAlive } from 'react-activation';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { protectedRouteDefinitions } from '@/router/routeDefinitions';
import { buildMenuFromRoutes, getOpenKeysForPathname } from '@/router/utils/buildMenuFromRoutes';
import { filterDefinitionsByAccess } from '@/router/utils/routeAccess';
import { useRouteTitle } from '@/router/hooks/useRouteTitle';
import { useCurrentRouteMeta } from '@/router/hooks/useCurrentRouteMeta';
import { RouteBreadcrumb } from '@/components/RouteBreadcrumb';
import { TabBar } from '@/components/TabBar';
import { AnimatedOutlet } from '@/components/AnimatedOutlet';
import styles from './index.module.scss';
import { useAuthStore } from '@/stores';
import { useTabStore } from '@/stores/tabStore';

const SIDER_COLLAPSED_KEY = 'admin-sider-collapsed';

const AdminLayout: React.FC = () => {
  useRouteTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const pathname = location.pathname || '/';
  const logout = useAuthStore((s) => s.logout);
  const meta = useCurrentRouteMeta();
  const addTab = useTabStore((s) => s.addTab);
  const setActiveKey = useTabStore((s) => s.setActiveKey);
  const closeAllTabs = useTabStore((s) => s.closeAll);

  const filteredRoutes = useMemo(() => filterDefinitionsByAccess(protectedRouteDefinitions), []);

  // 路由变化时同步 tab：仅依赖 pathname，避免 meta 先更新时用旧 pathname 把刚关闭的 tab 加回
  useEffect(() => {
    if (pathname === '/login' || pathname === '*' || !meta || meta.menu?.hide) return;
    addTab({ key: pathname, path: pathname, title: meta.breadcrumbLabel, closable: pathname !== '/' });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [pathname]); // 不依赖 meta，pathname 变化时 meta 已与 pathname 对应

  // 仅当 pathname 变化时同步 activeKey，避免 meta 先于 pathname 更新导致覆盖乐观更新的 activeKey 产生闪烁
  useEffect(() => {
    if (pathname === '/login' || pathname === '*') return;
    setActiveKey(pathname);
  }, [pathname, setActiveKey]);

  const menuItems = useMemo(() => buildMenuFromRoutes(filteredRoutes), [filteredRoutes]);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDER_COLLAPSED_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });
  const selectedKeys = useMemo(() => [pathname], [pathname]);

  const openKeys = useMemo(() => getOpenKeysForPathname(filteredRoutes, pathname), [filteredRoutes, pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(SIDER_COLLAPSED_KEY, JSON.stringify(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  const handleMenuClick: React.ComponentProps<typeof Menu>['onClick'] = ({ key }) => {
    // 菜单点击触发路由切换动画 相同路由不要跳转
    if (key === location.pathname) return;
    if (typeof key === 'string' && key.startsWith('/')) {
      navigate(key, { viewTransition: true } as { viewTransition?: boolean });
    }
  };

  const userMenuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: '个人中心',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      // 清除 tab
      closeAllTabs();
      logout();

      navigate('/login', { replace: true });
    } else if (key.startsWith('/')) {
      navigate(key, { viewTransition: true } as { viewTransition?: boolean });
    }
  };

  return (
    <Layout className={styles.root}>
      <Layout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={220}
        collapsedWidth={64}
        className={styles.sider}
      >
        <div className={cn(styles.logoWrap, collapsed && styles.logoWrapCollapsed)}>
          {!collapsed && <span className={styles.logoText}>x9系统</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMenuClick}
          className={styles.menu}
        />
      </Layout.Sider>

      <Layout className={styles.mainLayout}>
        <Layout.Header className={styles.header}>
          <div className={styles.headerLeft}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className={styles.headerBtn}
              aria-label={collapsed ? '展开菜单' : '收起菜单'}
            />

            <RouteBreadcrumb className={styles.breadcrumb} />
          </div>
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button type="text" icon={<UserOutlined />} className={styles.headerBtn}>
              用户
            </Button>
          </Dropdown>
        </Layout.Header>

        <div className={styles.tabBarWrap}>
          <TabBar />
        </div>

        <Layout.Content className={styles.content} data-scroll-container>
          {meta?.keepAlive && outlet ? (
            <KeepAlive cacheKey={pathname} name={pathname} autoFreeze={false}>
              <AnimatedOutlet>{outlet}</AnimatedOutlet>
            </KeepAlive>
          ) : (
            <AnimatedOutlet />
          )}
        </Layout.Content>

        <Layout.Footer className={styles.footer}>图片管理系统 ©{new Date().getFullYear()} 版权所有</Layout.Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
