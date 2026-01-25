import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseProject } from "../../src/core";
import { postProcessSvg } from "../../src/core/emitter";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";

function silenceConsole() {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => {
    log.mockRestore();
    error.mockRestore();
  };
}

describe("postProcessSvg", () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    restore = silenceConsole();
  });

  afterEach(() => {
    restore?.();
  });

  it("wraps known type labels with links", () => {
    const settings = new TsUML2Settings();
    settings.tsconfig = path.resolve(process.cwd(), "tsconfig.json");
    settings.glob = "./src/demo/katana.ts";

    const declarations = parseProject(settings);

    const svg = [
      "<svg>",
      "  <text>Katana</text>",
      "  <text>DoesNotExist</text>",
      "</svg>",
    ].join("\n");

    const out = postProcessSvg(svg, path.resolve(process.cwd(), "out.svg"), declarations);

    expect(out).toContain("<a id=");
    expect(out).toMatch(/xlink:href=\".*katana\.ts\"/i);
    expect(out).toContain(".Katana\"");

    // Unknown text nodes should not be wrapped.
    expect(out).toContain("<text>DoesNotExist</text>");
  });

  it("uses diagramPath to compute relative link targets", () => {
    const settings = new TsUML2Settings();
    settings.tsconfig = path.resolve(process.cwd(), "tsconfig.json");
    settings.glob = "./src/demo/katana.ts";

    const declarations = parseProject(settings);

    const svg = ["<svg>", "  <text>Katana</text>", "</svg>"].join("\n");

    // Put the diagram in a nested folder to force relative path computation.
    const diagramPath = path.resolve(process.cwd(), "assets", "out.svg");
    const out = postProcessSvg(svg, diagramPath, declarations);

    // Should link to the source file of Katana (path separators may vary by OS)
    expect(out).toMatch(/xlink:href=\".*[\\/]src[\\/]demo[\\/]katana\.ts\"/i);
  });

  it("handles <text> nodes with attributes and extra whitespace", () => {
    const settings = new TsUML2Settings();
    settings.tsconfig = path.resolve(process.cwd(), "tsconfig.json");
    settings.glob = "./src/demo/katana.ts";

    const declarations = parseProject(settings);

    const svg = [
      "<svg>",
      "   <text x=\"1\" y=\"2\">Katana</text>   ",
      "</svg>",
    ].join("\n");

    const out = postProcessSvg(svg, path.resolve(process.cwd(), "out.svg"), declarations);
    expect(out).toMatch(/<a id=\".*\.Katana\" xlink:href=\".*katana\.ts\">\s*<text x=\"1\" y=\"2\">Katana<\/text>\s*<\/a>/i);
  });
});
