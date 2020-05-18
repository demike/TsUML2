import { flatten, join } from "lodash";
import { renderNomnomlSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseClassHeritageClauses, parseInterfaceHeritageClauses } from "./parser";
import { emitSingleClass, emitSingleInterface, emitHeritageClauses, postProcessSvg } from "./emitter";
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
    const path = f.getFilePath();
    console.log(chalk.yellow(path));
    return {
      fileName: path,
      classes: classes.map(parseClasses),
      interfaces: interfaces.map(parseInterfaces),
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
    const heritageClauses = d.heritageClauses.map(emitHeritageClauses);
    return [...classes, ...interfaces, ...flatten(heritageClauses)];
  });

  return getStyling() + join(flatten(entities), "\n");
}

function getStyling(): string {
  return '#.interface: fill=lightblue\n' + SETTINGS.nomnoml.join("\n");
}

export function createNomnomlSVG(settings: TsUML2Settings) {

  // parse
  const declarations = parse(settings.tsconfig, settings.glob)

  // emit
  console.log(chalk.yellow("\nemitting declarations:"));
  const dsl = emit(declarations);

  //render
  console.log(chalk.yellow("\nrender to svg"));
  let svg = renderNomnomlSVG(dsl);
  svg = postProcessSvg(svg,settings.outFile, declarations);

  fs.writeFile(SETTINGS.outFile,svg,(err) => {
    if(err) {
        console.log(chalk.redBright("Error writing file: " + err));
    }
  });

  return svg;
}
