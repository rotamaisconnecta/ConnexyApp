import { existsSync } from "node:fs";

export type JsonObject = Record<string, unknown>;

export class CdpClient {
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve(value: JsonObject): void; reject(error: Error): void }
  >();
  private readonly eventWaiters = new Map<string, Array<(params: JsonObject) => void>>();

  private constructor(private readonly socket: WebSocket) {
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data)) as {
        id?: number;
        method?: string;
        sessionId?: string;
        params?: JsonObject;
        result?: JsonObject;
        error?: { message?: string };
      };
      if (message.id) {
        const waiter = this.pending.get(message.id);
        if (!waiter) return;
        this.pending.delete(message.id);
        if (message.error) waiter.reject(new Error(message.error.message ?? "CDP error"));
        else waiter.resolve(message.result ?? {});
        return;
      }
      if (!message.method) return;
      const key = `${message.sessionId ?? ""}:${message.method}`;
      const waiters = this.eventWaiters.get(key) ?? [];
      this.eventWaiters.delete(key);
      for (const waiter of waiters) waiter(message.params ?? {});
    });
  }

  static async connect(url: string): Promise<CdpClient> {
    const socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("Falha no WebSocket CDP")), {
        once: true,
      });
    });
    return new CdpClient(socket);
  }

  send(method: string, params: JsonObject = {}, sessionId?: string): Promise<JsonObject> {
    const id = this.nextId++;
    const response = new Promise<JsonObject>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    return response;
  }

  waitForEvent(method: string, sessionId: string, timeoutMs = 10_000): Promise<JsonObject> {
    const key = `${sessionId}:${method}`;
    return new Promise<JsonObject>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Timeout esperando ${method}`)), timeoutMs);
      const waiters = this.eventWaiters.get(key) ?? [];
      waiters.push((params) => {
        clearTimeout(timeout);
        resolve(params);
      });
      this.eventWaiters.set(key, waiters);
    });
  }

  close(): void {
    this.socket.close();
  }
}

export async function devtoolsUrl(
  stream: ReadableStream<Uint8Array>,
  timeoutMs = 10_000,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let output = "";
  const timeout = setTimeout(() => void reader.cancel(), timeoutMs);
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
      const match = output.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) return match[1];
    }
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
  throw new Error(`Chrome não publicou endpoint CDP: ${output}`);
}

export function chromeBinary(): string {
  const candidates = [
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((value): value is string => Boolean(value));
  const executable = candidates.find((candidate) => existsSync(candidate));
  if (!executable) throw new Error("Chrome/Chromium necessário para validar reload real");
  return executable;
}

export async function evaluate<T>(
  cdp: CdpClient,
  sessionId: string,
  expression: string,
): Promise<T> {
  const response = (await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise: true, returnByValue: true },
    sessionId,
  )) as {
    result?: { value?: T; description?: string };
    exceptionDetails?: { text?: string };
  };
  if (response.exceptionDetails) {
    throw new Error(
      `${response.result?.description ?? response.exceptionDetails.text ?? "Erro no browser"}: ${JSON.stringify(response.exceptionDetails)}`,
    );
  }
  return response.result?.value as T;
}
