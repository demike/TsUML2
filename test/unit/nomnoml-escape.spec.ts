import { describe, expect, it } from "vitest";
import { NomnomlTemplate } from "../../src/core/renderer/nomnoml-template";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";
import type { MethodDetails, PropertyDetails } from "../../src/core/model";
import { ts } from "ts-morph";

describe("NomnomlTemplate", () => {
  it("escapes characters that are special in nomnoml", () => {
    const settings = new TsUML2Settings();
    const template = new NomnomlTemplate(settings);

    const props: PropertyDetails[] = [
      {
        modifierFlags: ts.ModifierFlags.Public,
        name: "a|b]c#d",
        type: "X|Y",
        typeIds: [],
        optional: false,
      },
    ];

    const methods: MethodDetails[] = [
      {
        modifierFlags: ts.ModifierFlags.Public,
        name: "m|n]o#p",
        returnType: "R|S",
      },
    ];

    const rendered = template.class("C", props, methods);

    // Escape happens in both property name and type.
    expect(rendered).toContain("a\\|b\\]c\\#d");
    expect(rendered).toContain("X\\|Y");
    expect(rendered).toContain("m\\|n\\]o\\#p");
    expect(rendered).toContain("R\\|S");
  });
});
