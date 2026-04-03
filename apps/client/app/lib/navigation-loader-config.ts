export interface RouteLoaderConfig {
  enabled?: boolean
  triggerOnNavigate?: boolean
  animate?: boolean
}

const ROUTE_LOADING_CONFIG: Record<string, RouteLoaderConfig> = {
  '/nfa': { enabled: true, triggerOnNavigate: true, animate: true },
  '/tm': { enabled: true, triggerOnNavigate: true, animate: true },
}

function getRouteConfig(route: string): RouteLoaderConfig {
  return ROUTE_LOADING_CONFIG[route] ?? {}
}

export function shouldEnableLoader(route: string): boolean {
  return getRouteConfig(route).enabled === true
}

export function shouldTriggerNavigationLoader(route: string): boolean {
  const config = getRouteConfig(route)
  return config.enabled === true && config.triggerOnNavigate !== false
}

export function shouldAnimateLoader(route: string): boolean {
  const config = getRouteConfig(route)
  return config.enabled === true && config.animate === true
}
