import { renderNomnomlSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseEnum, parseTypes } from "./parser/parser";
import { postProcessSvg, Emitter, emit } from "./emitter";
import { NomnomlTemplate } from  './renderer/nomnoml-template';
import { TsUML2Settings } from "./tsuml2-settings";
import chalk from 'chalk';
import { FileDeclaration, TypeAlias } from "./model";
import * as fs from 'fs/promises';
import { parseAssociations } from "./parser";
import { MermaidTemplate } from "./renderer/mermaid-template";
import { ExportGetableNode } from "ts-morph";

export async function createDiagram(settings: TsUML2Settings) {
  // parse
  const declarations = parseProject(settings)
  if(declarations.length === 0) {
    console.log(chalk.red("\nno declarations found! tsconfig: " + settings.tsconfig, " glob: " + settings.glob));
    return;
  }

    // emit
    return Promise.all([ createMermaidDSL(declarations, settings),
                  createNomnomlSVG(declarations, settings)]);
}

/**
 * parse a typescript project
 * @param settings tsuml2 settings
 * @returns 
 */
export function parseProject(settings: TsUML2Settings): FileDeclaration[] {
  const ast = getAst(settings.tsconfig, settings.glob);
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

    if(settings.exportedTypesOnly) {
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

  if(settings.memberAssociations) {
    parseAssociations(declarations);
  }

  return declarations;
}


async function createNomnomlSVG(declarations: FileDeclaration[], settings: TsUML2Settings) {
  const outDSL = settings.outDsl ;
  const outFile = settings.outFile;

  if(outDSL === "" && outFile === "" ) {
    return;
  }

  let promises = [];

  const dsl = getNomnomlDSL(declarations,settings);
  if(outDSL !== "") {
    promises.push(writeDsl(dsl, outDSL, 'nomnoml'));
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
  try {
    promises.push(fs.writeFile(outFile,svg));
    await Promise.all(promises);
  } catch(err) {
    console.log(chalk.redBright("Error writing file: " + err));  
  }

  return svg;
}

async function createMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  if(!settings.outMermaidDsl) {
    return;
  }
  const dsl = getMermaidDSL(declarations,settings);
  await writeDsl(dsl, settings.outMermaidDsl, 'mermaid');
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
  return getNomnomlDSLHeader(settings) + emit(declarations, new Emitter(new NomnomlTemplate(settings)));
}

/**
 * get the mermaid DSL representing the class diagram as a string
 * @param declarations 
 * @param settings 
 * @returns 
 */
export function getMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  console.log(chalk.yellow("\nemitting mermaid declarations:"));
  return getMermaidDSLHeader(settings) + emit(declarations, new Emitter(new MermaidTemplate(settings)));
}



function getNomnomlDSLHeader(settings: TsUML2Settings): string {
  return '#.interface: fill=lightblue\n' +
    '#.enumeration: fill=lightgreen\n' +
    '#.type: fill=lightgray\n' +
    settings.nomnoml.join("\n");
}

function getMermaidDSLHeader(settings: TsUML2Settings): string {
  return '\nclassDiagram\n' + settings.mermaid.join("\n") + '\n'; 
}


async function writeDsl(dsl: string, fileName: string, dslType: 'mermaid'| 'nomnoml') {
  console.log(chalk.green(`\nwriting ${dslType} DSL`));
  try  {
    await fs.writeFile(fileName,dsl);
  } catch( err) {
    console.log(chalk.redBright(`Error writing ${dslType} DSL file: ${err}`));
  }
}


function removeNonExportedNodes<T extends ExportGetableNode>(nodes: T[] ): T[] {
  return nodes.filter(n => n.isExported());
}
