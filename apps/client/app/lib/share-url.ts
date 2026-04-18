const SHARE_DOMAINS: Record<string, string> = {
  'delta.sydneyn.dev': 'https://share.delta.sydneyn.dev',
  'comptheory.tools': 'https://share.comptheory.tools',
}

export function getShareBaseUrl(): string {
  const hostname = window.location.hostname
  for (const [root, url] of Object.entries(SHARE_DOMAINS)) {
    if (hostname === root || hostname.endsWith(`.${root}`))
      return url
  }
  return SHARE_DOMAINS['delta.sydneyn.dev']
}
