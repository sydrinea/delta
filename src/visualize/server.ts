import Fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { WebSocket } from "ws";

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(__dirname, "client.html"), "utf-8");

const fastify = Fastify();
await fastify.register(fastifyWebsocket);

const clients = new Set<WebSocket>();

fastify.get("/", async (_req, reply) => {
  reply.type("text/html").send(html);
});

let lastPayload: string | null = null;

fastify.register(async (fastify) => {
  fastify.get("/ws", { websocket: true }, (socket) => {
    clients.add(socket);
    if (lastPayload) socket.send(lastPayload);
    socket.on("close", () => clients.delete(socket));
  });
});

export function broadcast(payload: {
  dot: string;
  step: number;
  total: number;
  activeStates: string[];
  accepted: boolean | null;
  input: string;
  machineName: string;
}): void {
  const svg = execSync("dot -Tsvg", {
    input: payload.dot,
    encoding: "utf-8",
  });

  const message = JSON.stringify({ ...payload, svg });
  lastPayload = message;
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

export async function startServer(port = 4000): Promise<void> {
  await fastify.listen({ port });
  console.log(`Delta visualizer running at http://localhost:${port}`);
}
