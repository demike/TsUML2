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

export function createDiagram(settings: TsUML2Settings) {
  // parse
  const declarations = parse(settings.tsconfig, settings.glob)
  if(declarations.length === 0) {
    console.log(chalk.red("\nno declarations found! tsconfig: " + settings.tsconfig, " glob: " + settings.glob));
    return;
  }

    // emit
    createMermaidDSL(declarations, settings);
    createNomnomlSVG(declarations, settings);
}

function parse(tsConfigPath: string, pattern: string): FileDeclaration[] {
  const ast = getAst(tsConfigPath, pattern);
  const files = ast.getSourceFiles();
  // parser
  console.log(chalk.yellow("parsing source files:"));
  const declarations: FileDeclaration[] = files.map(f => {
    const classes = f.getClasses();
    const interfaces = f.getInterfaces();
    const enums = f.getEnums();
    const types = f.getTypeAliases();
    const path = f.getFilePath();
    console.log(chalk.yellow(path));

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

export function createNomnomlSVG(declarations: FileDeclaration[], settings: TsUML2Settings) {
  const outDSL = settings.outDsl ;
  const outFile = settings.outFile;

  if(outDSL === "" && outFile === "" ) {
    return;
  }

  console.log(chalk.yellow("\nemitting nomnoml declarations:"));
  const dsl = getNomnomlDSLHeader(settings) + emit(declarations, new Emitter(nomnomlTemplate));
  
  if(outDSL !== "") {
    console.log(chalk.green("\nwriting nomnoml DSL"));
    fs.writeFile(outDSL,dsl,(err) => {
      if(err) {
          console.log(chalk.redBright("Error writing nomnoml DSL file: " + err));
      }
    });
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

export function createMermaidDSL(declarations: FileDeclaration[], settings: TsUML2Settings) {
  if(!settings.outMermaidDsl) {
    return;
  }

  console.log(chalk.yellow("\nemitting mermaid declarations:"));
  const dsl = getMermaidDSLHeader(settings) + emit(declarations, new Emitter(mermaidTemplate));
  
  console.log(chalk.green("\nwriting mermaid DSL"));
  fs.writeFile(settings.outMermaidDsl,dsl,(err) => {
    if(err) {
      console.log(chalk.redBright("Error writing mermaid DSL file: " + err));
    }
  });

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
