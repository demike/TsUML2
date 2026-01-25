import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";

const originalArgv = process.argv;

afterEach(() => {
  process.argv = originalArgv;
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadParser() {
  // parse-settings.ts uses a singleton yargs instance; reset modules between tests
  // to avoid option/state leakage across tests.
  const mod = await import("../../src/core/parse-settings");
  return mod.parseSettingsFromArgs as (settings: TsUML2Settings) => void;
}

describe("parseSettingsFromArgs", () => {
  it("merges config.json and allows CLI args to override", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsuml2-parse-settings-"));
    const configPath = path.join(tmpDir, "config.json");

    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          glob: "./from-config/**/*.ts",
          modifiers: false,
          propertyTypes: false,
          memberAssociations: false,
        },
        null,
        2,
      ),
      "utf8",
    );

    process.argv = [
      "node",
      "tsuml2",
      "--glob",
      "./from-cli/**/*.ts",
      "--config",
      configPath,
      "--modifiers",
      "true",
      "--propertyTypes",
      "true",
      "-m",
    ];

    const parseSettingsFromArgs = await loadParser();
    const settings = new TsUML2Settings();
    parseSettingsFromArgs(settings);

    expect(settings.glob).toBe("./from-cli/**/*.ts");
    expect(settings.modifiers).toBe(true);
    expect(settings.propertyTypes).toBe(true);
    expect(settings.memberAssociations).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("parses repeated nomnoml/mermaid lines as arrays", async () => {
    process.argv = [
      "node",
      "tsuml2",
      "--glob",
      "./src/demo/**/*.ts",
      "--nomnoml",
      "#arrowSize: 1",
      "--nomnoml",
      "#.interface: fill=#8f8 dashed",
      "--mermaid",
      "direction LR",
      "--mermaid",
      "%% comment",
    ];

    const parseSettingsFromArgs = await loadParser();
    const settings = new TsUML2Settings();
    parseSettingsFromArgs(settings);

    expect(settings.nomnoml).toEqual([
      "#arrowSize: 1",
      "#.interface: fill=#8f8 dashed",
    ]);
    expect(settings.mermaid).toEqual(["direction LR", "%% comment"]);
  });
});
