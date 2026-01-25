import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { getMermaidDSL, parseProject } from "../../src/core";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";

function toGlob(p: string) {
  // ts-morph globs are happier with forward slashes
  return p.replace(/\\/g, "/");
}

describe("integration: association inheritance de-dup", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsuml2-assoc-"));

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it("removes associations on derived types when inherited from base", () => {
    // Minimal TS project where both Base and Derived declare the same array association.
    const tsconfigPath = path.join(tmpDir, "tsconfig.json");
    const sourcePath = path.join(tmpDir, "model.ts");

    fs.writeFileSync(
      tsconfigPath,
      JSON.stringify(
        {
          compilerOptions: {
            target: "es2020",
            module: "commonjs",
            strict: true,
            esModuleInterop: true,
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    fs.writeFileSync(
      sourcePath,
      [
        "export class Item { id = 1; }",
        "export class Base { items: Item[] = []; }",
        "export class Derived extends Base { items: Item[] = []; }",
      ].join("\n"),
      "utf8",
    );

    const restoreLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const restoreErr = vi.spyOn(console, "error").mockImplementation(() => {});

    const settings = new TsUML2Settings();
    settings.tsconfig = tsconfigPath;
    settings.glob = toGlob(path.join(tmpDir, "**/*.ts"));
    settings.memberAssociations = true;

    const declarations = parseProject(settings);
    const mermaid = getMermaidDSL(declarations, settings);

    restoreLog.mockRestore();
    restoreErr.mockRestore();

    // Base -> Item array association must exist with multiplicity
    expect(mermaid).toMatch(/Base\s+--\s+\"0\.\.\*\"\s+Item/);

    // Derived should NOT have its own association line because it is inherited
    expect(mermaid).not.toMatch(/Derived\s+--\s+\"0\.\.\*\"\s+Item/);

    // Sanity: still shows inheritance
    expect(mermaid).toContain("Base<|--Derived");
  });
});
