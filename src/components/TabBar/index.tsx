import { useNavigate, useLocation } from 'react-router-dom';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { useAliveController } from 'react-activation';
import { useTabStore } from '@/stores/tabStore';
import styles from './index.module.scss';

export function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname || '/';
  const { refresh } = useAliveController();
  const { tabs, activeKey, removeTab, setActiveKey, closeOthers, closeLeft, closeRight, closeAll } = useTabStore();

  const handleTabClick = (key: string) => {
    if (key === pathname) return;
    setActiveKey(key);
    navigate(key);
  };

  const handleClose = (e: React.MouseEvent, targetKey: string) => {
    e.stopPropagation(); // 阻止冒泡，避免触发 tab 的 onClick
    const wasActive = activeKey === targetKey;
    const idx = tabs.findIndex((t) => t.key === targetKey);
    const goTo = tabs[idx - 1] ?? tabs[idx + 1];
    if (wasActive && goTo) {
      navigate(goTo.key);
      setActiveKey(goTo.key);
    }
    removeTab(targetKey);
  };

  const getContextMenuItems = (targetKey: string): MenuProps['items'] => {
    const idx = tabs.findIndex((t) => t.key === targetKey);
    const hasLeft = idx > 0;
    const hasRight = idx >= 0 && idx < tabs.length - 1;
    const hasOthers = tabs.length > 1;

    return [
      {
        key: 'refresh',
        label: '刷新',
        onClick: () => {
          setActiveKey(targetKey);
          navigate(targetKey);
          setTimeout(() => refresh(targetKey), 0);
        },
      },
      { type: 'divider' },
      {
        key: 'closeOthers',
        label: '关闭其他',
        disabled: !hasOthers,
        onClick: () => {
          closeOthers(targetKey);
          if (activeKey !== targetKey) navigate(targetKey);
        },
      },
      {
        key: 'closeLeft',
        label: '关闭左侧',
        disabled: !hasLeft,
        onClick: () => {
          const willSwitch = tabs.findIndex((t) => t.key === activeKey) < idx;
          closeLeft(targetKey);
          if (willSwitch) navigate(targetKey);
        },
      },
      {
        key: 'closeRight',
        label: '关闭右侧',
        disabled: !hasRight,
        onClick: () => {
          const willSwitch = tabs.findIndex((t) => t.key === activeKey) > idx;
          closeRight(targetKey);
          if (willSwitch) navigate(targetKey);
        },
      },
      {
        key: 'closeAll',
        label: '关闭全部',
        onClick: () => {
          closeAll();
          navigate('/');
        },
      },
    ];
  };

  if (tabs.length < 1) return null;

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => (
        <Dropdown key={tab.key} menu={{ items: getContextMenuItems(tab.key) }} trigger={['contextMenu']}>
          <div
            className={`${styles.tab} ${activeKey === tab.key ? styles.active : ''}`}
            onClick={() => handleTabClick(tab.key)}
          >
            <span className={styles.label}>{tab.title}</span>
            {tab.closable && (
              <span className={styles.close} onClick={(e) => handleClose(e, tab.key)} aria-label="关闭">
                ×
              </span>
            )}
          </div>
        </Dropdown>
      ))}
    </div>
  );
}
