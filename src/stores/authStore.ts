import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const AUTH_STORAGE_KEY = 'auth-storage';

type Role = 'admin' | 'user' | 'guest';

interface AuthState {
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 用户 token（示例用，实际应从登录 API 获取） */
  token: string | null;
  /** 用户角色（示例用） */
  roles: Role[];
  /** 用户权限标识（示例用，如 image:read、settings:manage） */
  permissions: string[];
  /** 登录 */
  login: (token: string, roles?: Role[], permissions?: string[]) => void;
  /** 登出 */
  logout: () => void;
  /** 检查是否有指定权限/角色 */
  hasRole: (role: Role) => boolean;
  /** 检查是否有任一角色 */
  hasAnyRole: (roles: Role[]) => boolean;
  /** 检查是否有任一权限 */
  hasAnyAuth: (auth: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      roles: [],
      permissions: [],

      login: (token, roles = [], permissions = []) => set({ isAuthenticated: true, token, roles, permissions }),

      logout: () => set({ isAuthenticated: false, token: null, roles: [], permissions: [] }),

      hasRole: (role) => get().roles.includes(role),

      hasAnyRole: (roles) => roles.length === 0 || roles.some((r) => get().roles.includes(r)),

      hasAnyAuth: (auth) => auth.length === 0 || auth.some((a) => get().permissions.includes(a)),
    }),
    { name: AUTH_STORAGE_KEY }
  )
);
