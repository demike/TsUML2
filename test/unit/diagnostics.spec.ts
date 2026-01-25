import { describe, expect, it } from "vitest";
import { createArrayDiagnosticsCollector, provideDiagnostics } from "../../src/core/diagnostics";
import { NamedType } from "../../src/core/model";
import { emit, Emitter } from "../../src/core/emitter";
import type { Template } from "../../src/core/renderer/template";

describe("DiagnosticsCollector", () => {
  it("captures warnings from getRelativeFilePath when id is malformed", () => {
    const { diagnostics, collector } = createArrayDiagnosticsCollector();
    const prev = provideDiagnostics(collector);

    const t = new NamedType({ name: "X", id: "not-a-fully-qualified-id" });
    const rel = t.getRelativeFilePath(null);

    provideDiagnostics(prev);

    expect(rel).toBe("");
    expect(diagnostics.some((d) => d.level === "warn")).toBe(true);
  });

  it("captures an error when emit() processes no entities", () => {
    const { diagnostics, collector } = createArrayDiagnosticsCollector();
    const prev = provideDiagnostics(collector);

    const template: Template = {
      composition: "",
      implements: () => "",
      extends: () => "",
      plainClassOrInterface: () => "",
      class: () => "",
      interface: () => "",
      type: () => "",
      enum: () => "",
      memberAssociation: () => "",
    };

    const output = emit([], new Emitter(template));

    provideDiagnostics(prev);

    expect(output).toContain("Could not process any class / interface / enum / type");
    expect(diagnostics.some((d) => d.level === "error")).toBe(true);
  });
});
