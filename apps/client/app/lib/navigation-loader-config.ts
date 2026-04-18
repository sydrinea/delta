export interface RouteLoaderConfig {
  enabled?: boolean
  triggerOnNavigate?: boolean
  animate?: boolean
}

const ROUTE_LOADING_CONFIG: Record<string, RouteLoaderConfig> = {
  '/nfa': { enabled: true, triggerOnNavigate: true, animate: true },
  '/pda': { enabled: true, triggerOnNavigate: true, animate: true },
  '/tm': { enabled: true, triggerOnNavigate: true, animate: true },
}

function getRouteConfig(route: string): RouteLoaderConfig {
  const sortedPrefixes = Object.keys(ROUTE_LOADING_CONFIG).sort((a, b) => b.length - a.length)

  for (const prefix of sortedPrefixes) {
    if (route.startsWith(prefix)) {
      return ROUTE_LOADING_CONFIG[prefix]
    }
  }

  return {}
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
