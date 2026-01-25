import { ExportGetableNode } from "ts-morph";
import { renderNomnomlSVG } from "./io";
import { postProcessSvg, Emitter, emit } from "./emitter";
import { TsUML2Settings } from "./tsuml2-settings";
import { FileDeclaration, TypeAlias } from "./model";
import { parseAssociations } from "./parser";
import { getAst, parseClasses, parseEnum, parseInterfaces, parseTypes } from "./parser/parser";
import { MermaidTemplate } from "./renderer/mermaid-template";
import { NomnomlTemplate } from "./renderer/nomnoml-template";

/**
 * Functional core: parses a TypeScript project into declarations.
 * No logging, no file IO.
 */
export function parseProject(settings: TsUML2Settings): FileDeclaration[] {
  const ast = getAst(settings.tsconfig, settings.glob);
  const files = ast.getSourceFiles();

  const parserOptions = {
    propertyTypes: settings.propertyTypes,
    memberAssociations: settings.memberAssociations,
  };

  const declarations: FileDeclaration[] = files.map((file) => {
    let classes = file.getClasses();
    let interfaces = file.getInterfaces();
    let enums = file.getEnums();
    let types = file.getTypeAliases();

    if (settings.exportedTypesOnly) {
      classes = removeNonExportedNodes(classes);
      interfaces = removeNonExportedNodes(interfaces);
      enums = removeNonExportedNodes(enums);
      types = removeNonExportedNodes(types);
    }

    const classDeclarations = classes.map((c) => parseClasses(c, parserOptions));
    const interfaceDeclarations = interfaces.map((i) => parseInterfaces(i, parserOptions));

    return {
      fileName: file.getFilePath(),
      classes: classDeclarations,
      interfaces: interfaceDeclarations,
      types: types.map((t) => parseTypes(t, parserOptions)).filter((t) => t !== undefined) as TypeAlias[],
      enums: enums.map((e) => parseEnum(e)),
      heritageClauses: [
        ...classDeclarations
          .filter((decl) => decl.heritageClauses.length > 0)
          .map((decl) => decl.heritageClauses),
        ...interfaceDeclarations
          .filter((decl) => decl.heritageClauses.length > 0)
          .map((decl) => decl.heritageClauses),
      ],
    };
  });

  if (settings.memberAssociations) {
    parseAssociations(declarations);
  }

  return declarations;
}

/** Pure: returns nomnoml DSL for given declarations/settings. */
export function getNomnomlDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  return getNomnomlDSLHeader(settings) + "\n" + emit(declarations, new Emitter(new NomnomlTemplate(settings)));
}

/** Pure: returns mermaid DSL for given declarations/settings. */
export function getMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  return getMermaidDSLHeader(settings) + "\n" + emit(declarations, new Emitter(new MermaidTemplate(settings)));
}

/**
 * Pure(ish): renders the SVG string from declarations.
 * No file IO; link paths are computed relative to diagramPathForLinks.
 */
export function renderNomnomlSvgFromDeclarations(
  declarations: FileDeclaration[],
  settings: TsUML2Settings,
  diagramPathForLinks?: string | null,
) {
  const dsl = getNomnomlDSL(declarations, settings);
  let svg = renderNomnomlSVG(dsl);

  if (settings.typeLinks && diagramPathForLinks) {
    svg = postProcessSvg(svg, diagramPathForLinks, declarations);
  }

  return { dsl, svg };
}

function getNomnomlDSLHeader(settings: TsUML2Settings): string {
  return (
    "#.interface: fill=lightblue\n" +
    "#.enumeration: fill=lightgreen\n" +
    "#.type: fill=lightgray\n" +
    settings.nomnoml.join("\n")
  );
}

function getMermaidDSLHeader(settings: TsUML2Settings): string {
  return "\nclassDiagram\n" + settings.mermaid.join("\n") + "\n";
}

function removeNonExportedNodes<T extends ExportGetableNode>(nodes: T[]): T[] {
  return nodes.filter((n) => n.isExported());
}
