import type { RouteDefinition } from '../routeDefinitions';
import { useAuthStore } from '@/stores';

/**
 * 检查当前用户是否可访问该路由
 * 同时校验 handle.roles 与 handle.auth，均通过才可访问
 * - roles/auth 为空或未定义表示无限制
 */
export function canAccessRoute(def: RouteDefinition): boolean {
  const { hasAnyRole, hasAnyAuth } = useAuthStore.getState();

  const roles = def.handle?.roles;
  const auth = def.handle?.auth;

  const rolesPass = !roles || roles.length === 0 || hasAnyRole(roles as Array<'admin' | 'user' | 'guest'>);
  const authPass = !auth || auth.length === 0 || hasAnyAuth(auth);

  return rolesPass && authPass;
}

/**
 * 递归过滤路由定义树，仅保留当前用户可访问的路由
 */
export function filterDefinitionsByAccess(defs: RouteDefinition[]): RouteDefinition[] {
  return defs.filter(canAccessRoute).map((def) => ({
    ...def,
    children: def.children?.length ? filterDefinitionsByAccess(def.children) : undefined,
  }));
}
