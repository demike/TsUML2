export type DiagnosticLevel = "info" | "warn" | "error";

export type Diagnostic = {
  level: DiagnosticLevel;
  message: string;
  data?: unknown;
};

export interface DiagnosticsCollector {
  report(diagnostic: Diagnostic): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

export const NullDiagnosticsCollector: DiagnosticsCollector = {
  report: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

export function createArrayDiagnosticsCollector() {
  const diagnostics: Diagnostic[] = [];

  const collector: DiagnosticsCollector = {
    report: (diagnostic) => {
      diagnostics.push(diagnostic);
    },
    info: (message, data) => diagnostics.push({ level: "info", message, data }),
    warn: (message, data) => diagnostics.push({ level: "warn", message, data }),
    error: (message, data) => diagnostics.push({ level: "error", message, data }),
  };

  return { diagnostics, collector };
}

export function createConsoleDiagnosticsCollector(
  logger: Pick<Console, "log" | "warn" | "error"> = console,
): DiagnosticsCollector {
  return {
    report: ({ level, message, data }) => {
      if (level === "error") {
        logger.error(message, data);
      } else if (level === "warn") {
        logger.warn(message, data);
      } else {
        logger.log(message, data);
      }
    },
    info: (message, data) => logger.log(message, data),
    warn: (message, data) => logger.warn(message, data),
    error: (message, data) => logger.error(message, data),
  };
}
