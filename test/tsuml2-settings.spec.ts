import { describe, expect, it } from "vitest";
import { TsUML2Settings } from "../src/core/tsuml2-settings";

describe("TsUML2Settings", () => {
  it("has expected defaults", () => {
    const settings = new TsUML2Settings();

    expect(settings.glob).toBe("");
    expect(settings.outFile).toBe("out.svg");
    expect(settings.propertyTypes).toBe(true);
    expect(settings.modifiers).toBe(true);
    expect(settings.typeLinks).toBe(true);
    expect(settings.memberAssociations).toBe(false);
    expect(settings.exportedTypesOnly).toBe(false);
  });
});
