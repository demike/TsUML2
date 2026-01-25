import path from "node:path";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { parseProject } from "../../src/core";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";

function silenceConsole() {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => {
    log.mockRestore();
    error.mockRestore();
  };
}

describe("parser", () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    restore = silenceConsole();
  });

  afterEach(() => {
    restore?.();
  });

  it("keeps optional property types clean (no trailing '| undefined')", () => {
    const settings = new TsUML2Settings();
    settings.tsconfig = path.resolve(process.cwd(), "tsconfig.json");
    settings.glob = "./src/demo/interfaces.ts";

    const declarations = parseProject(settings);

    const interfacesFile = declarations.find((d) =>
      d.fileName.replace(/\\/g, "/").endsWith("/src/demo/interfaces.ts"),
    );
    expect(interfacesFile).toBeTruthy();

    const attribute = interfacesFile!.interfaces.find((i) =>
      i.name.startsWith("Attribute"),
    );
    expect(attribute).toBeTruthy();

    const description = attribute!.properties.find((p) => p.name === "description");
    expect(description).toBeTruthy();
    expect(description!.optional).toBe(true);

    // In TS, `description?: string` becomes `string | undefined` at the type level;
    // tsuml2 strips the ` | undefined` suffix for cleaner diagrams.
    expect(description!.type).toBe("string");
    expect(description!.type).not.toContain("undefined");
  });
});
