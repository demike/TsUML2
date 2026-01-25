import chalk from "chalk";
import * as fs from "fs/promises";
import { TsUML2Settings } from "./tsuml2-settings";
import type { FileDeclaration } from "./model";
import { getMermaidDSL, getNomnomlDSL, parseProject, renderNomnomlSvgFromDeclarations } from "./diagram-engine";
import { createConsoleDiagnosticsCollector } from "./diagnostics";

export async function createDiagram(settings: TsUML2Settings) {
  const diagnostics = createConsoleDiagnosticsCollector();
  const declarations = parseProject(settings, diagnostics);

  if (declarations.length === 0) {
    console.log(
      chalk.red(
        "\nno declarations found! tsconfig: " + settings.tsconfig,
        " glob: " + settings.glob,
      ),
    );
    return;
  }

  return Promise.all([
    writeMermaidDslIfRequested(declarations, settings),
    writeNomnomlOutputsIfRequested(declarations, settings),
  ]);
}

// Re-export pure APIs for library usage.
export { parseProject, getNomnomlDSL, getMermaidDSL, renderNomnomlSvgFromDeclarations };

export type { Diagnostic, DiagnosticLevel, DiagnosticsCollector } from "./diagnostics";
export { NullDiagnosticsCollector, createArrayDiagnosticsCollector, createConsoleDiagnosticsCollector } from "./diagnostics";

async function writeNomnomlOutputsIfRequested(declarations: FileDeclaration[], settings: TsUML2Settings) {
  const outDsl = settings.outDsl;
  const outFile = settings.outFile;

  if (outDsl === "" && outFile === "") {
    return;
  }

  const { dsl, svg } = renderNomnomlSvgFromDeclarations(declarations, settings, outFile || null);

  const writes: Promise<any>[] = [];

  if (outDsl !== "") {
    console.log(chalk.green(`\nwriting nomnoml DSL`));
    writes.push(fs.writeFile(outDsl, dsl));
  }

  if (outFile !== "") {
    console.log(chalk.green(`\nwriting SVG`));
    writes.push(fs.writeFile(outFile, svg));
  }

  try {
    await Promise.all(writes);
  } catch (err) {
    console.log(chalk.redBright("Error writing file: " + err));
  }

  return svg;
}

async function writeMermaidDslIfRequested(declarations: FileDeclaration[], settings: TsUML2Settings) {
  if (!settings.outMermaidDsl) {
    return;
  }

  const dsl = getMermaidDSL(declarations, settings);
  console.log(chalk.green(`\nwriting mermaid DSL`));

  try {
    await fs.writeFile(settings.outMermaidDsl, dsl);
  } catch (err) {
    console.log(chalk.redBright(`Error writing mermaid DSL file: ${err}`));
  }

  return dsl;
}
