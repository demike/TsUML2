import chalk from "chalk";
import * as fs from "fs/promises";
import { TsUML2Settings } from "./tsuml2-settings";
import type { FileDeclaration } from "./model";
import {
  getMermaidDSL,
  getNomnomlDSL,
  parseProject,
  renderNomnomlSvgFromDeclarations,
} from "./diagram-engine";
import { createConsoleDiagnosticsCollector, provideDiagnostics } from "./diagnostics";
import type { DiagnosticsCollector } from "./diagnostics";

export type CreateDiagramOptions = {
  diagnostics?: DiagnosticsCollector;
};

export async function createDiagram(settings: TsUML2Settings, options: CreateDiagramOptions = {}) {
  const diagnostics = options.diagnostics ?? createConsoleDiagnosticsCollector();
  const previous = provideDiagnostics(diagnostics);

  try {
    const declarations = parseProject(settings);

  if (declarations.length === 0) {
    console.log(
      chalk.red(
        "\nno declarations found! tsconfig: " + settings.tsconfig,
        " glob: " + settings.glob,
      ),
    );
    return;
  }

    return await Promise.all([
      writeMermaidDslIfRequested(declarations, settings),
      writeNomnomlOutputsIfRequested(declarations, settings),
    ]);
  } finally {
    provideDiagnostics(previous);
  }
}

// Re-export pure APIs for library usage.
export {
  parseProject,
  getNomnomlDSL,
  getMermaidDSL,
  renderNomnomlSvgFromDeclarations,
};

export type { Diagnostic, DiagnosticLevel, DiagnosticsCollector } from "./diagnostics";
export {
  NullDiagnosticsCollector,
  createArrayDiagnosticsCollector,
  createConsoleDiagnosticsCollector,
  provideDiagnostics,
  logger,
} from "./diagnostics";

async function writeNomnomlOutputsIfRequested(
  declarations: FileDeclaration[],
  settings: TsUML2Settings,
) {
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

async function writeMermaidDslIfRequested(
  declarations: FileDeclaration[],
  settings: TsUML2Settings,
) {
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
