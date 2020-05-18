import { flatten, join } from "lodash";
import { renderNomnomlSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseClassHeritageClauses, parseInterfaceHeritageClauses, parseEnum } from "./parser";
import { emitSingleClass, emitSingleInterface, emitHeritageClauses, postProcessSvg, emitSingleEnum } from "./emitter";
import { SETTINGS, TsUML2Settings } from "./tsuml2-settings";
import * as chalk from 'chalk';
import { FileDeclaration } from "./model";
import * as fs from 'fs';


function parse(tsConfigPath: string, pattern: string): FileDeclaration[] {
  const ast = getAst(tsConfigPath, pattern);
  const files = ast.getSourceFiles();
  // parser
  console.log(chalk.yellow("parsing source files:"));
  const declarations: FileDeclaration[] = files.map(f => {
    const classes = f.getClasses();
    const interfaces = f.getInterfaces();
    const enums = f.getEnums();
    const path = f.getFilePath();
    console.log(chalk.yellow(path));
    return {
      fileName: path,
      classes: classes.map(parseClasses),
      interfaces: interfaces.map(parseInterfaces),
      enums: enums.map(parseEnum),
      heritageClauses: [...classes.map(parseClassHeritageClauses),...interfaces.map(parseInterfaceHeritageClauses)]
    };
  });
  return declarations;
}

function emit(declarations: FileDeclaration[]) {
  const entities = declarations.map(d => {
    console.log(chalk.yellow(d.fileName));
    const classes = d.classes.map((c) => emitSingleClass(c));
    const interfaces = d.interfaces.map((i) => emitSingleInterface(i));
    const enums = d.enums.map((i) => emitSingleEnum(i));
    const heritageClauses = d.heritageClauses.map(emitHeritageClauses);
    return [...classes, ...interfaces, ...enums, ...flatten(heritageClauses)];
  });

  return getStyling() + join(flatten(entities), "\n");
}

function getStyling(): string {
  return '#.interface: fill=lightblue\n' +
    '#.enumeration: fill=lightgreen\n' +
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
  const dsl = emit(declarations);

  //render
  console.log(chalk.yellow("\nrender to svg"));
  let svg = renderNomnomlSVG(dsl);
  if(settings.typeLinks) {
    svg = postProcessSvg(svg,settings.outFile, declarations);
  }

  fs.writeFile(SETTINGS.outFile,svg,(err) => {
    if(err) {
        console.log(chalk.redBright("Error writing file: " + err));
    }
  });

  return svg;
}
