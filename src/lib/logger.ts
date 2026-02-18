type LogLevel = "info" | "warn" | "error";

type LogPayload = {
  event: string;
  route?: string;
  method?: string;
  status?: number;
  sessionId?: string;
  reason?: string;
};

function write(level: LogLevel, payload: LogPayload): void {
  const message = {
    ts: new Date().toISOString(),
    level,
    ...payload,
  };

  console[level](JSON.stringify(message));
}

export const logger = {
  info: (payload: LogPayload) => write("info", payload),
  warn: (payload: LogPayload) => write("warn", payload),
  error: (payload: LogPayload) => write("error", payload),
};
