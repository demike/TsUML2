import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { execSync, spawnSync } from "node:child_process";

const repoRoot = process.cwd();

function run(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.error ? String(result.error) : "",
        result.stdout,
        result.stderr,
      ].join("\n"),
    );
  }
  return result;
}

describe("integration: CLI end-to-end", () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tsuml2-"));

  afterAll(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup
    }
  });

  it(
    "builds and generates SVG + DSL outputs from demo sources",
    () => {
    try {
      execSync("npm run build", { cwd: repoRoot, stdio: "pipe" });
    } catch (err: any) {
      const stdout = err?.stdout?.toString?.() ?? "";
      const stderr = err?.stderr?.toString?.() ?? "";
      throw new Error(["npm run build failed", stdout, stderr].join("\n"));
    }

    const outSvg = path.join(tmpDir, "out.svg");
    const outNomnomlDsl = path.join(tmpDir, "out.nomnoml.dsl");
    const outMermaidDsl = path.join(tmpDir, "out.mermaid.dsl");

    const cli = path.join(repoRoot, "dist", "bin", "index.js");

    run(
      process.execPath,
      [
        cli,
        "--glob",
        "./src/demo/**/*.ts",
        "-m",
        "-o",
        outSvg,
        "--outDsl",
        outNomnomlDsl,
        "--outMermaidDsl",
        outMermaidDsl,
      ],
      repoRoot,
    );

    expect(fs.existsSync(outSvg)).toBe(true);
    expect(fs.statSync(outSvg).size).toBeGreaterThan(50);

    const mermaid = fs.readFileSync(outMermaidDsl, "utf8");
    expect(mermaid).toContain("classDiagram");
    expect(mermaid).toContain("class Katana");

    const nomnoml = fs.readFileSync(outNomnomlDsl, "utf8");
    expect(nomnoml).toContain("[Katana|");
    },
    30_000,
  );
});
