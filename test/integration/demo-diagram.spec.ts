import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMermaidDSL, getNomnomlDSL, parseProject } from "../../src/core";
import { TsUML2Settings } from "../../src/core/tsuml2-settings";

function silenceConsole() {
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  return () => {
    log.mockRestore();
    error.mockRestore();
  };
}

function demoSettings(overrides?: Partial<TsUML2Settings>) {
  const settings = new TsUML2Settings();
  settings.tsconfig = path.resolve(process.cwd(), "tsconfig.json");
  settings.glob = "./src/demo/**/*.ts";
  Object.assign(settings, overrides);
  return settings;
}

describe("integration: generate demo diagram DSL", () => {
  let restore: (() => void) | undefined;

  beforeEach(() => {
    restore = silenceConsole();
  });

  afterEach(() => {
    restore?.();
  });

  it("produces expected core entities and heritage links", () => {
    const settings = demoSettings({ memberAssociations: false });
    const declarations = parseProject(settings);

    const nomnoml = getNomnomlDSL(declarations, settings);
    expect(nomnoml).toContain("[Katana|");
    expect(nomnoml).toContain("[Weapon]<:--[Katana]");

    const mermaid = getMermaidDSL(declarations, settings);
    expect(mermaid).toContain("class Katana");
    expect(mermaid).toContain("Weapon<|..Katana");
  });

  it("includes member associations only when enabled", () => {
    const settingsOff = demoSettings({ memberAssociations: false });
    const declOff = parseProject(settingsOff);
    const mermaidOff = getMermaidDSL(declOff, settingsOff);
    expect(mermaidOff).not.toContain("Ninja  --  Weapon");

    const settingsOn = demoSettings({ memberAssociations: true });
    const declOn = parseProject(settingsOn);
    const mermaidOn = getMermaidDSL(declOn, settingsOn);
    expect(mermaidOn).toContain("Ninja  --  Weapon");
  });

  it("respects exportedTypesOnly (filters non-exported types)", () => {
    const settingsAll = demoSettings({ exportedTypesOnly: false });
    const declAll = parseProject(settingsAll);
    const mermaidAll = getMermaidDSL(declAll, settingsAll);
    expect(mermaidAll).toContain("class Blockade");

    const settingsExported = demoSettings({ exportedTypesOnly: true });
    const declExported = parseProject(settingsExported);
    const mermaidExported = getMermaidDSL(declExported, settingsExported);
    expect(mermaidExported).not.toContain("class Blockade");
  });

  it("renders enums and type literals", () => {
    const settings = demoSettings({ memberAssociations: false });
    const declarations = parseProject(settings);

    const nomnoml = getNomnomlDSL(declarations, settings);
    expect(nomnoml).toContain("[<enumeration>Gender|");
    expect(nomnoml).toContain("[<type>MagicDurability|");

    const mermaid = getMermaidDSL(declarations, settings);
    expect(mermaid).toContain("class Gender");
    expect(mermaid).toContain("<<enumeration>>");
    expect(mermaid).toContain("class MagicDurability");
    expect(mermaid).toContain("<<type>>");
  });

  it("escapes special characters for Nomnoml (brackets in property names)", () => {
    const settings = demoSettings({ memberAssociations: false });
    const declarations = parseProject(settings);

    const nomnoml = getNomnomlDSL(declarations, settings);
    // From src/demo/viking.ts: public "superMagic[Name]"?: string;
    expect(nomnoml).toContain("superMagic\\[Name\\]?: string");
  });

  it("renders generics consistently", () => {
    const settings = demoSettings({ memberAssociations: false });
    const declarations = parseProject(settings);

    const nomnoml = getNomnomlDSL(declarations, settings);
    expect(nomnoml).toContain("[MagicKatana<MT>");
    expect(nomnoml).toContain("[Viking<WT>");

    const mermaid = getMermaidDSL(declarations, settings);
    // Mermaid template escapes generics using ~
    expect(mermaid).toContain("class MagicKatana~MT~");
    expect(mermaid).toContain("class Viking~WT~");
  });

  it("omits member type annotations when propertyTypes=false", () => {
    const settings = demoSettings({ memberAssociations: false, propertyTypes: false });
    const declarations = parseProject(settings);

    const mermaid = getMermaidDSL(declarations, settings);
    // With propertyTypes disabled, method return types and property type annotations should be omitted.
    expect(mermaid).toContain("tryHit()");
    expect(mermaid).not.toContain("tryHit() boolean");
    expect(mermaid).not.toContain("name: string");
  });

  it("omits visibility modifiers when modifiers=false", () => {
    const settings = demoSettings({ memberAssociations: false, modifiers: false });
    const declarations = parseProject(settings);

    const nomnoml = getNomnomlDSL(declarations, settings);
    // No leading +/#/- should be present when modifiers are disabled.
    expect(nomnoml).toContain("[Katana|");
    expect(nomnoml).not.toContain("+tryHit()");
    expect(nomnoml).not.toContain("-_");

    const mermaid = getMermaidDSL(declarations, settings);
    expect(mermaid).toContain("tryHit()");
    expect(mermaid).not.toContain("+tryHit()");
  });

  it("includes multiplicity for array associations when enabled", () => {
    const settings = demoSettings({ memberAssociations: true });
    const declarations = parseProject(settings);

    const mermaid = getMermaidDSL(declarations, settings);
    // From src/demo/viking.ts: bag: EquipmentPart<any>[] => multiplicity 0..*
    expect(mermaid).toMatch(/Viking~WT~\s+--\s+"0\.\.\*"\s+EquipmentPart~[^~]+~/);
  });
});
