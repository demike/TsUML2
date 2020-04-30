import { flatten, join } from "lodash";
import { renderToSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseClassHeritageClauses, parseInterfaceHeritageClauses } from "./parser";
import { emitSingleClass, emitSingleInterface, emitHeritageClauses } from "./emitter";
import { SETTINGS } from "./tsuml2-settings";
import * as chalk from 'chalk';

function getDsl(tsConfigPath: string, pattern: string) {
  const ast = getAst(tsConfigPath, pattern);
  const files = ast.getSourceFiles();

  // parser
  console.log(chalk.yellow("parsing source files:"));
  const declarations = files.map(f => {
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

  // emitter
  console.log(chalk.yellow("\nemitting declarations:"));
  const entities = declarations.map(d => {
    console.log(chalk.yellow(d.fileName));
    const classes = d.classes.map((c) => emitSingleClass(c.className, c.properties, c.methods));
    const interfaces = d.interfaces.map((i) => emitSingleInterface(i.interfaceName, i.properties, i.methods));
    const heritageClauses = d.heritageClauses.map(emitHeritageClauses);
    return [...classes, ...interfaces, ...flatten(heritageClauses)];
  });

  return getStyling() + join(flatten(entities), "\n");

}

function getStyling(): string {
  return '#.interface: fill=lightblue\n' + SETTINGS.nomnoml.join("\n");
}

export function getSVG(tsConfigPath: string, pattern: string) {
  const dsl = getDsl(tsConfigPath, pattern);

  console.log(chalk.yellow("\nrender to svg"));
  return renderToSVG(dsl);
}
