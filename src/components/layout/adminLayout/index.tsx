import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import { Layout, Menu, Button, Dropdown } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { protectedRouteDefinitions } from '@/router/routeDefinitions';
import { buildMenuFromRoutes, getOpenKeysForPathname } from '@/router/utils/buildMenuFromRoutes';
import { filterDefinitionsByAccess } from '@/router/utils/routeAccess';
import { useRouteTitle } from '@/router/hooks/useRouteTitle';
import styles from './index.module.scss';
import { useAuthStore } from '@/stores';

const SIDER_COLLAPSED_KEY = 'admin-sider-collapsed';

const AdminLayout: React.FC = () => {
  useRouteTitle();
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname || '/';
  const logout = useAuthStore((s) => s.logout);

  const filteredRoutes = useMemo(() => filterDefinitionsByAccess(protectedRouteDefinitions), []);

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
    if (typeof key === 'string' && key.startsWith('/')) {
      navigate(key);
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
      logout();
      navigate('/login', { replace: true });
    } else if (key.startsWith('/')) {
      navigate(key);
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
          {!collapsed && <span className={styles.logoText}>图片管理</span>}
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
            <h2 className={styles.headerTitle}>欢迎回来</h2>
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

        <Layout.Content className={styles.content}>
          <Outlet />
        </Layout.Content>

        <Layout.Footer className={styles.footer}>图片管理系统 ©{new Date().getFullYear()} 版权所有</Layout.Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
