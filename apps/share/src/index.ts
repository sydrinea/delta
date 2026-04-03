export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    // POST /machine — store machineType+code, return short id
    if (request.method === 'POST' && url.pathname === '/machine') {
      const { machineType, code } = await request.json<{
        machineType: 'nfa' | 'tm'
        code: string
      }>()
      if (!machineType) {
        return new Response('missing machineType', {
          status: 400,
          headers: cors,
        })
      }
      if (machineType !== 'nfa' && machineType !== 'tm') {
        return new Response('invalid machineType', {
          status: 400,
          headers: cors,
        })
      }
      if (!code)
        return new Response('missing code', { status: 400, headers: cors })

      const id = crypto.randomUUID().slice(0, 8)
      await env.DELTA_SHARE.put(id, JSON.stringify({ machineType, code }), {
        expirationTtl: 60 * 60 * 24 * 90,
      }) // 90 days
      return Response.json({ id }, { headers: cors })
    }

    // GET /machine/:id — retrieve machineType+code
    if (request.method === 'GET' && url.pathname.startsWith('/machine')) {
      const id = url.pathname.split('/').pop()
      if (!id)
        return new Response('missing id', { status: 400, headers: cors })

      const raw = await env.DELTA_SHARE.get(id)
      if (!raw)
        return new Response('not found', { status: 404, headers: cors })

      const { machineType, code } = JSON.parse(raw) as {
        machineType: 'nfa' | 'tm'
        code: string
      }

      return Response.json({ machineType, code }, { headers: cors })
    }

    return new Response('not found', { status: 404, headers: cors })
  },
} satisfies ExportedHandler<Env>
