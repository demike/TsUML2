import { describe, expect, it } from "vitest";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";
import { MermaidTemplate } from "../../src/core/renderer/mermaid-template";

describe("MermaidTemplate", () => {
  it("escapes generics and braces in class names", () => {
    const settings = new TsUML2Settings();
    const template = new MermaidTemplate(settings);

    expect(template.plainClassOrInterface("MagicWeapon<MT>")).toBe(
      "MagicWeapon~MT~",
    );

    // Mermaid doesn't like raw braces in identifiers; template encodes them.
    expect(template.plainClassOrInterface("X{Y}")).toBe("X#123;Y#125;");
  });
});
