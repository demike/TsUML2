import { renderNomnomlSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseEnum, parseTypes } from "./parser/parser";
import { postProcessSvg, Emitter } from "./emitter";
import { nomnomlTemplate } from  './renderer/nomnoml-template';
import { SETTINGS, TsUML2Settings } from "./tsuml2-settings";
import chalk from 'chalk';
import { FileDeclaration, TypeAlias } from "./model";
import * as fs from 'fs';
import { parseAssociations } from "./parser";
import { Template } from "./renderer/template";

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

function emit(declarations: FileDeclaration[], emitter: Emitter) {
  const entities = declarations.map(d => {
    console.log(chalk.yellow(d.fileName));
    const classes = d.classes.map((c) => emitter.emitSingleClass(c));
    const interfaces = d.interfaces.map((i) => emitter.emitSingleInterface(i));
    const enums = d.enums.map((i) => emitter.emitSingleEnum(i));
    const types = d.types.map((t) => emitter.emitSingleType(t));
    const heritageClauses = d.heritageClauses.map((clause) => emitter.emitHeritageClauses(clause));
    const memberAssociations = emitter.emitMemberAssociations(d.memberAssociations);
    return [...classes, ...interfaces, ...enums, ...types, ...heritageClauses.flat(), ...memberAssociations];
  
  }).flat();


  if(entities.length === 0) {
    const errorMsg = "Could not process any class / interface / enum / type";
    console.log(chalk.red(errorMsg));
    entities.push(`[${errorMsg}]`);
  }

  return getStyling() + entities.join("\n");
}

function getStyling(): string {
  return '#.interface: fill=lightblue\n' +
    '#.enumeration: fill=lightgreen\n' +
    '#.type: fill=lightgray\n' +
    SETTINGS.nomnoml.join("\n");
}

export function createNomnomlSVG(settings: TsUML2Settings) {

  // parse
  const declarations = parse(settings.tsconfig, settings.glob)
  if(declarations.length === 0) {
    console.log(chalk.red("\nno declarations found! tsconfig: " + settings.tsconfig, " glob: " + settings.glob));
    return;
  }

  // emit
  console.log(chalk.yellow("\nemitting declarations:"));
  const dsl = emit(declarations, new Emitter(nomnomlTemplate));
  const outDSL = settings.outDsl || SETTINGS.outDsl;
  if(outDSL !== "") {
    console.log(chalk.green("\nwriting DSL"));
    fs.writeFile(outDSL,dsl,(err) => {
      if(err) {
          console.log(chalk.redBright("Error writing DSL file: " + err));
      }
    });
  }

  //render
  const outFile = settings.outFile || SETTINGS.outFile;
  console.log(chalk.yellow("\nrender to svg"));
  let svg = renderNomnomlSVG(dsl);
  if(settings.typeLinks) {
    console.log(chalk.yellow("\nadding type links to svg"));
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
