export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // POST /anf — store ANF+code, return short id
    if (request.method === "POST" && url.pathname === "/anf") {
      const { anf, code } = await request.json<{ anf: string; code: string }>();
      if (!anf)
        return new Response("missing anf", { status: 400, headers: cors });
      if (!code)
        return new Response("missing code", { status: 400, headers: cors });

      const id = crypto.randomUUID().slice(0, 8);
      await env.DELTA_SHARE.put(id, JSON.stringify({ anf, code }), {
        expirationTtl: 60 * 60 * 24 * 90,
      }); // 90 days
      return Response.json({ id }, { headers: cors });
    }

    // GET /anf/:id — retrieve ANF+code
    if (request.method === "GET" && url.pathname.startsWith("/anf")) {
      const id = url.pathname.split("/").pop();
      if (!id)
        return new Response("missing id", { status: 400, headers: cors });

      const raw = await env.DELTA_SHARE.get(id);
      if (!raw)
        return new Response("not found", { status: 404, headers: cors });

      const { anf, code } = JSON.parse(raw);

      return Response.json({ anf, code }, { headers: cors });
    }

    return new Response("not found", { status: 404, headers: cors });
  },
} satisfies ExportedHandler<Env>;
