import { afterEach, describe, expect, it } from "vitest";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";
import adapterDefault, { manifest } from "../src/index.js";
import { execute, resolveSessionKey } from "../src/server/execute.js";
import { createServerAdapter } from "../src/server/adapter.js";

function buildContext(
  config: Record<string, unknown>,
  overrides?: Partial<AdapterExecutionContext>,
): AdapterExecutionContext {
  return {
    runId: "run-123",
    agent: {
      id: "agent-123",
      companyId: "company-123",
      name: "OpenClaw Bridge Agent",
      adapterType: "openclaw_bridge",
      adapterConfig: {},
    },
    runtime: {
      sessionId: null,
      sessionParams: null,
      sessionDisplayId: null,
      taskKey: null,
    },
    config,
    context: {
      taskId: "task-123",
      issueId: "issue-123",
      wakeReason: "issue_assigned",
      issueIds: ["issue-123"],
      paperclipWake: { reason: "issue_assigned" },
    },
    onLog: async () => {},
    ...overrides,
  };
}

async function createMockPaperclipApi() {
  let patchedStatus: string | null = null;
  let patchCount = 0;

  const server = createServer((req, res) => {
    if (req.method === "PATCH" && req.url?.includes("/api/issues/")) {
      patchCount++;
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        const payload = JSON.parse(body);
        patchedStatus = payload.status;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to resolve mock API address");

  return {
    url: `http://127.0.0.1:${address.port}`,
    getPatchedStatus: () => patchedStatus,
    getPatchCount: () => patchCount,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

async function createMockGatewayServer(options?: { summary?: string }) {
  const server = createServer();
  const wss = new WebSocketServer({ server });
  let agentPayload: Record<string, unknown> | null = null;

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "event", event: "connect.challenge", payload: { nonce: "nonce-123" } }));

    socket.on("message", (raw) => {
      const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw);
      const frame = JSON.parse(text) as {
        type: string;
        id: string;
        method: string;
        params?: Record<string, unknown>;
      };
      if (frame.type !== "req") return;

      if (frame.method === "connect") {
        socket.send(JSON.stringify({
          type: "res",
          id: frame.id,
          ok: true,
          payload: {
            type: "hello-ok",
            protocol: 3,
            server: { version: "test", connId: "conn-1" },
            features: { methods: ["connect", "agent", "agent.wait"], events: ["agent"] },
            snapshot: { version: 1, ts: Date.now() },
            policy: { maxPayload: 1_000_000, maxBufferedBytes: 1_000_000, tickIntervalMs: 30_000 },
          },
        }));
        return;
      }

      if (frame.method === "agent") {
        agentPayload = frame.params ?? null;
        const runId = typeof frame.params?.idempotencyKey === "string" ? frame.params.idempotencyKey : "run-123";
        socket.send(JSON.stringify({
          type: "res",
          id: frame.id,
          ok: true,
          payload: { runId, status: "accepted", acceptedAt: Date.now() },
        }));

        // Simulate agent output if provided
        if (options?.summary) {
          socket.send(JSON.stringify({
            type: "event",
            event: "agent",
            payload: {
              runId,
              stream: "assistant",
              data: { text: options.summary },
            },
          }));
        }
        return;
      }

      if (frame.method === "agent.wait") {
        socket.send(JSON.stringify({
          type: "res",
          id: frame.id,
          ok: true,
          payload: { runId: frame.params?.runId, status: "ok", startedAt: 1, endedAt: 2 },
        }));
      }
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Failed to resolve test server address");

  return {
    url: `ws://127.0.0.1:${address.port}`,
    getAgentPayload: () => agentPayload,
    close: async () => {
      await new Promise<void>((resolve) => wss.close(() => resolve()));
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

afterEach(() => {
  // no-op hook so vitest doesn't complain if we expand cleanup later
});

describe("resolveSessionKey", () => {
  it("prefixes run-scoped session keys with the configured agent", () => {
    expect(resolveSessionKey({ strategy: "run", configuredSessionKey: null, agentId: "meridian", runId: "run-123", issueId: null })).toBe(
      "agent:meridian:paperclip:run:run-123",
    );
  });

  it("prefixes issue-scoped session keys with the configured agent", () => {
    expect(resolveSessionKey({ strategy: "issue", configuredSessionKey: null, agentId: "meridian", runId: "run-123", issueId: "issue-456" })).toBe(
      "agent:meridian:paperclip:issue:issue-456",
    );
  });

  it("prefixes fixed session keys with the configured agent", () => {
    expect(resolveSessionKey({ strategy: "fixed", configuredSessionKey: "paperclip", agentId: "meridian", runId: "run-123", issueId: null })).toBe(
      "agent:meridian:paperclip",
    );
  });

  it("does not double-prefix an already-routed session key", () => {
    expect(resolveSessionKey({ strategy: "fixed", configuredSessionKey: "agent:meridian:paperclip", agentId: "meridian", runId: "run-123", issueId: null })).toBe(
      "agent:meridian:paperclip",
    );
  });
});

describe("package root exports", () => {
  it("exposes manifest metadata and a default server adapter instance", () => {
    expect(manifest).toMatchObject({
      id: "paperclip-openclaw-bridge",
      adapters: [{ type: "openclaw_bridge", label: "OpenClaw Bridge" }],
    });
    expect(adapterDefault).toMatchObject({ type: "openclaw_bridge" });
  });
});

describe("createServerAdapter", () => {
  it("exposes a config schema so Paperclip can render gateway fields in the agent form", async () => {
    const adapter = createServerAdapter();
    const schema = await adapter.getConfigSchema?.();

    expect(schema?.fields.some((field) => field.key === "url" && field.required === true)).toBe(true);
    expect(schema?.fields.some((field) => field.key === "authToken")).toBe(true);
    expect(schema?.fields.some((field) => field.key === "sessionKeyStrategy")).toBe(true);
    expect(schema?.fields.some((field) => field.key === "devicePrivateKeyPem" && field.type === "textarea")).toBe(true);
    expect(schema?.fields.some((field) => field.key === "scopes" && String(field.default).includes("operator.pairing"))).toBe(true);
    
    // Verify removal of claimedApiKeyPath
    expect(schema?.fields.some((field) => field.key === "claimedApiKeyPath")).toBe(false);
    
    const adapterModule = createServerAdapter();
    expect(adapterModule.supportsLocalAgentJwt).toBe(true);
  });
});

describe("execute", () => {
  it("renders a clean task prompt without technical jargon", async () => {
    const gateway = await createMockGatewayServer();
    try {
      await execute(buildContext({
        url: gateway.url,
        disableDeviceAuth: true,
      }));

      const payload = gateway.getAgentPayload() ?? {};
      const message = String(payload.message ?? "");
      
      expect(message).toContain("PAPERCLIP TASK ASSIGNMENT");
      expect(message).toContain("CONTEXT:");
      expect(message).toContain("- RUN ID: run-123");
      expect(message).toContain("- TASK ID: task-123");
      expect(message).toContain("TASK DESCRIPTION:");
      expect(message).not.toContain("Paperclip wake event for a cloud adapter");
      expect(message).not.toContain("task_id="); // metadata block should be gone
      expect(message).toContain("MANDATORY: When the task is complete, you MUST include a line with exactly 'STATUS: DONE'");
      expect(message).toContain("MANDATORY: If the task is blocked, you MUST include a line with exactly 'STATUS: BLOCKED'");
    } finally {
      await gateway.close();
    }
  });

  it("proxies status updates when the agent signals STATUS: DONE", async () => {
    const paperclipApi = await createMockPaperclipApi();
    const gateway = await createMockGatewayServer({
      summary: "I have finished the task.\nSTATUS: DONE\n",
    });

    try {
      const result = await execute(
        buildContext({
          url: gateway.url,
          disableDeviceAuth: true,
          paperclipApiUrl: paperclipApi.url,
        }, {
          authToken: "valid-token",
        }),
      );

      expect(result.exitCode).toBe(0);
      expect(result.summary).toContain("STATUS: DONE");
      expect(result.resultJson).toMatchObject({ summary: result.summary });
      
      // Wait for async proxy call if needed, but in our case it's awaited in execute
      expect(paperclipApi.getPatchCount()).toBe(1);
      expect(paperclipApi.getPatchedStatus()).toBe("done");
    } finally {
      await gateway.close();
      await paperclipApi.close();
    }
  });

  it("proxies status updates when the agent signals STATUS: BLOCKED", async () => {
    const paperclipApi = await createMockPaperclipApi();
    const gateway = await createMockGatewayServer({
      summary: "I am blocked by missing docs.\nSTATUS: BLOCKED\n",
    });

    try {
      await execute(
        buildContext({
          url: gateway.url,
          disableDeviceAuth: true,
          paperclipApiUrl: paperclipApi.url,
        }, {
          authToken: "valid-token",
        }),
      );

      expect(paperclipApi.getPatchCount()).toBe(1);
      expect(paperclipApi.getPatchedStatus()).toBe("blocked");
    } finally {
      await gateway.close();
      await paperclipApi.close();
    }
  });

  it("does not proxy status update when no signal is present", async () => {
    const paperclipApi = await createMockPaperclipApi();
    const gateway = await createMockGatewayServer({
      summary: "I have finished the task but forgot the signal.",
    });

    try {
      await execute(
        buildContext({
          url: gateway.url,
          disableDeviceAuth: true,
          paperclipApiUrl: paperclipApi.url,
        }, {
          authToken: "valid-token",
        }),
      );

      expect(paperclipApi.getPatchCount()).toBe(0);
    } finally {
      await gateway.close();
      await paperclipApi.close();
    }
  });

  it("does not proxy status update when signal is incorrect (e.g. STATUS: FINISHED)", async () => {
    const paperclipApi = await createMockPaperclipApi();
    const gateway = await createMockGatewayServer({
      summary: "Task complete!\nSTATUS: FINISHED\n",
    });

    try {
      await execute(
        buildContext({
          url: gateway.url,
          disableDeviceAuth: true,
          paperclipApiUrl: paperclipApi.url,
        }, {
          authToken: "valid-token",
        }),
      );

      expect(paperclipApi.getPatchCount()).toBe(0);
    } finally {
      await gateway.close();
      await paperclipApi.close();
    }
  });
});
