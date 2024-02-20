import { renderNomnomlSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseEnum, parseTypes } from "./parser/parser";
import { postProcessSvg, Emitter, emit } from "./emitter";
import { nomnomlTemplate } from  './renderer/nomnoml-template';
import { SETTINGS, TsUML2Settings } from "./tsuml2-settings";
import chalk from 'chalk';
import { FileDeclaration, TypeAlias } from "./model";
import * as fs from 'fs';
import { parseAssociations } from "./parser";
import { mermaidTemplate } from "./renderer/mermaid-template";
import { ExportGetableNode } from "ts-morph";

export function createDiagram(settings: TsUML2Settings) {
  // parse
  const declarations = parseProject(settings.tsconfig, settings.glob)
  if(declarations.length === 0) {
    console.log(chalk.red("\nno declarations found! tsconfig: " + settings.tsconfig, " glob: " + settings.glob));
    return;
  }

    // emit
    createMermaidDSL(declarations, settings);
    createNomnomlSVG(declarations, settings);
}

/**
 * parse a typescript project
 * @param tsConfigPath path to a tsconfig.json file
 * @param pattern the glob pattern defining a scope for typescript files to include (i.e.: a subfolder of the project)
 * @returns 
 */
export function parseProject(tsConfigPath: string, pattern: string): FileDeclaration[] {
  const ast = getAst(tsConfigPath, pattern);
  const files = ast.getSourceFiles();
  // parser
  console.log(chalk.yellow("parsing source files:"));
  const declarations: FileDeclaration[] = files.map(f => {
    let classes = f.getClasses();
    let interfaces = f.getInterfaces();
    let enums = f.getEnums();
    let types = f.getTypeAliases();
    const path = f.getFilePath();
    console.log(chalk.yellow(path));

    if(SETTINGS.exportedTypesOnly) {
      classes = removeNonExportedNodes(classes);
      interfaces = removeNonExportedNodes(interfaces);
      enums = removeNonExportedNodes(enums);
      types = removeNonExportedNodes(types);
    }

    const classDeclarations = classes.map(parseClasses);
    const interfaceDeclarations = interfaces.map(parseInterfaces);
    return {
      fileName: path,
      classes: classDeclarations,
      interfaces: interfaceDeclarations,
      types: types.map(parseTypes).filter(t => t !== undefined) as TypeAlias[],
      enums: enums.map(parseEnum),
      heritageClauses: [
        ...classDeclarations.filter(decl => decl.heritageClauses.length > 0).map(decl => decl.heritageClauses),
        ...interfaceDeclarations.filter(decl => decl.heritageClauses.length > 0).map(decl => decl.heritageClauses)
      ]
    };
  });

  if(SETTINGS.memberAssociations) {
    parseAssociations(declarations);
  }

  return declarations;
}


function createNomnomlSVG(declarations: FileDeclaration[], settings: TsUML2Settings) {
  const outDSL = settings.outDsl ;
  const outFile = settings.outFile;

  if(outDSL === "" && outFile === "" ) {
    return;
  }

  const dsl = getNomnomlDSL(declarations,settings);
  if(outDSL !== "") {
    writeDsl(dsl, outDSL, 'nomnoml');
  }

  if(outFile === "") {
    return;
  }

  //render
  console.log(chalk.yellow("\nrender to svg"));
  let svg = renderNomnomlSVG(dsl);
  if(settings.typeLinks) {
    console.log(chalk.yellow("adding type links to svg"));
    svg = postProcessSvg(svg,outFile, declarations);
  }

  console.log(chalk.green("\nwriting SVG"));
  fs.writeFile(outFile,svg,(err) => {
    if(err) {
        console.log(chalk.redBright("Error writing file: " + err));
    }
  });

  return svg;
}

function createMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  if(!settings.outMermaidDsl) {
    return;
  }
  const dsl = getMermaidDSL(declarations,settings);
  writeDsl(dsl, settings.outMermaidDsl, 'mermaid');
  return dsl;
}

/**
 * get the nomnoml DSL representing the class diagram as a string
 * @param declarations 
 * @param settings 
 * @returns 
 */
export function getNomnomlDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  console.log(chalk.yellow("\nemitting nomnoml declarations:"));
  return getNomnomlDSLHeader(settings) + emit(declarations, new Emitter(nomnomlTemplate));
}

/**
 * get the mermaid DSL representing the class diagram as a string
 * @param declarations 
 * @param settings 
 * @returns 
 */
export function getMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  console.log(chalk.yellow("\nemitting mermaid declarations:"));
  return getMermaidDSLHeader(settings) + emit(declarations, new Emitter(mermaidTemplate));
}



function getNomnomlDSLHeader(settings: TsUML2Settings): string {
  return '#.interface: fill=lightblue\n' +
    '#.enumeration: fill=lightgreen\n' +
    '#.type: fill=lightgray\n' +
    settings.nomnoml.join("\n");
}

function getMermaidDSLHeader(settings: TsUML2Settings): string {
  return '\nclassDiagram\n'; 
}


function writeDsl(dsl: string, fileName: string, dslType: 'mermaid'| 'nomnoml') {
  console.log(chalk.green(`\nwriting ${dslType} DSL`));
  fs.writeFile(fileName,dsl,(err) => {
    if(err) {
        console.log(chalk.redBright(`Error writing ${dslType} DSL file: ${err}`));
    }
  });
}


function removeNonExportedNodes<T extends ExportGetableNode>(nodes: T[] ): T[] {
  return nodes.filter(n => n.isExported());
}
