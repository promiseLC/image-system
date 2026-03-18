import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TabItem {
  key: string;
  path: string;
  title: string;
  closable: boolean;
}

interface TabState {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab: Omit<TabItem, 'closable'> & { closable?: boolean }) => void;
  removeTab: (key: string) => void;
  setActiveKey: (key: string) => void;
  closeOthers: (key: string) => void;
  closeLeft: (key: string) => void;
  closeRight: (key: string) => void;
  closeAll: () => void;
}

const HOME_PATH = '/';
const HOME_TITLE = '仪表盘';

export const useTabStore = create<TabState>()(
  persist(
    (set) => ({
      tabs: [{ key: HOME_PATH, path: HOME_PATH, title: HOME_TITLE, closable: false }],
      activeKey: HOME_PATH,

      addTab: (tab) =>
        set((state) => {
          const exists = state.tabs.some((t) => t.key === tab.key);
          if (exists) return { activeKey: tab.key };
          const newTab: TabItem = {
            ...tab,
            closable: tab.closable ?? tab.key !== HOME_PATH,
          };
          return {
            tabs: [...state.tabs, newTab],
            activeKey: tab.key,
          };
        }),

      removeTab: (key) =>
        set((state) => {
          if (key === HOME_PATH) return state;
          const next = state.tabs.filter((t) => t.key !== key);
          const wasActive = state.activeKey === key;
          const idx = state.tabs.findIndex((t) => t.key === key);
          const nextActive = wasActive
            ? ((state.tabs[idx - 1] ?? state.tabs[idx + 1])?.key ?? HOME_PATH)
            : state.activeKey;
          return { tabs: next, activeKey: nextActive };
        }),

      setActiveKey: (key) => set({ activeKey: key }),

      closeOthers: (key) =>
        set((state) => ({
          tabs: state.tabs.filter((t) => t.key === key || t.key === HOME_PATH),
          activeKey: key,
        })),

      closeLeft: (key) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.key === key);
          if (idx <= 0) return state;
          const toRemove = state.tabs
            .slice(0, idx)
            .filter((t) => t.key !== HOME_PATH)
            .map((t) => t.key);
          if (toRemove.length === 0) return state;
          const wasActiveRemoved = toRemove.includes(state.activeKey);
          const next = state.tabs.filter((t) => !toRemove.includes(t.key));
          return {
            tabs: next,
            activeKey: wasActiveRemoved ? key : state.activeKey,
          };
        }),

      closeRight: (key) =>
        set((state) => {
          const idx = state.tabs.findIndex((t) => t.key === key);
          if (idx < 0 || idx >= state.tabs.length - 1) return state;
          const toRemove = state.tabs
            .slice(idx + 1)
            .filter((t) => t.key !== HOME_PATH)
            .map((t) => t.key);
          if (toRemove.length === 0) return state;
          const wasActiveRemoved = toRemove.includes(state.activeKey);
          const next = state.tabs.filter((t) => !toRemove.includes(t.key));
          return {
            tabs: next,
            activeKey: wasActiveRemoved ? key : state.activeKey,
          };
        }),

      closeAll: () =>
        set({
          tabs: [{ key: HOME_PATH, path: HOME_PATH, title: HOME_TITLE, closable: false }],
          activeKey: HOME_PATH,
        }),
    }),
    { name: 'tab-storage' }
  )
);
