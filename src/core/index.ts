import { flatten, join } from "lodash";
import { renderToSVG } from "./io";
import { getAst, parseClasses, parseInterfaces, parseClassHeritageClauses, parseInterfaceHeritageClauses } from "./parser";
import { emitSingleClass, emitSingleInterface, emitHeritageClauses } from "./emitter";

function getDsl(tsConfigPath: string, pattern: string) {
  const ast = getAst(tsConfigPath, pattern);
  const files = ast.getSourceFiles();

  // parser
  const declarations = files.map(f => {
    const classes = f.getClasses();
    const interfaces = f.getInterfaces();
    const path = f.getFilePath();
    return {
      fileName: path,
      classes: classes.map(parseClasses),
      interfaces: interfaces.map(parseInterfaces),
      heritageClauses: [...classes.map(parseClassHeritageClauses),...interfaces.map(parseInterfaceHeritageClauses)]
    };
  });

  // emitter
  const entities = declarations.map(d => {
    const classes = d.classes.map((c) => emitSingleClass(c.className, c.properties, c.methods));
    const interfaces = d.interfaces.map((i) => emitSingleInterface(i.interfaceName, i.properties, i.methods));
    const heritageClauses = d.heritageClauses.map(emitHeritageClauses);
    return [...classes, ...interfaces, ...flatten(heritageClauses)];
  });

  return getStyling() + join(flatten(entities), "\n");

}

function getStyling(): string {
  return '#.interface: fill=lightblue\n#ranker: longest-path\n';
}
// #ranker: network-simplex | tight-tree | longest-path

export function getSVG(tsConfigPath: string, pattern: string) {
  const dsl = getDsl(tsConfigPath, pattern);
  return renderToSVG(dsl);
}
