import chalk from "chalk";
import { HeritageClause, HeritageClauseType, Clazz, Interface, FileDeclaration, Enum, TypeAlias, MemberAssociation } from "./model";

import { Template } from "./renderer/template";
export class Emitter {
    constructor(protected template: Template) {}
public emitSingleClass(cls: Clazz) {
    return this.template.class(cls.name, cls.properties, cls.methods);
}

public emitSingleInterface(int: Interface) {
    return this.template.interface(int.name, int.properties, int.methods);
}

public emitSingleType(t: TypeAlias) {
    return this.template.type(t.name, t.properties, t.methods);
}

public emitSingleEnum(en: Enum) {
    return this.template.enum(en.name, en.items);
}
  
public emitHeritageClauses(heritageClauses: HeritageClause[]) {
    return heritageClauses.map((heritageClause) => {
        if(heritageClause.type === HeritageClauseType.Extends) {
           return this.template.extends(heritageClause.clause, heritageClause.className);
        } else {
           return this.template.implements(heritageClause.clause, heritageClause.className);
        }

    });
}

public emitMemberAssociations(associations?: MemberAssociation[]) {
    return associations ? associations.map(this.template.memberAssociation) : [];
}
}


export function emit(declarations: FileDeclaration[], emitter: Emitter) {
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
  
    return entities.join("\n");
  }




function xmlEncode(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

/**
 * add type links to the svg
 * if a diagram path is given paths relative to the diagram will be generated for the links
 * @param svg 
 * @param diagramPath
 * @param declarations 
 * @returns 
 */
export function postProcessSvg(svg: string, diagramPath: string | undefined | null, declarations: FileDeclaration[]) {
    const classes: {[key:string]:Clazz} = {};
    const interfaces: {[key:string]:Interface} = {};
    const enums: {[key: string]:Enum} = {};
    const types: {[key: string]:TypeAlias} = {};

    declarations.map(d => {
        d.classes.forEach(cls => classes[xmlEncode(cls.name)] = cls);
        d.interfaces.forEach(i => interfaces[xmlEncode(i.name)] = i);
        d.enums.forEach(e => enums[xmlEncode(e.name)] = e);
        d.types.forEach(t => types[xmlEncode(t.name)] = t);
    });
   
    const rx = />(.*)</;
    const arOut = []
    let regexResult: RegExpExecArray | null;
    for(let line of svg.split('\n')) {
        line = line.trim();
        if(line.startsWith("<text") && (regexResult = rx.exec(line))) {
            let target = classes[regexResult[1]] || interfaces[regexResult[1]] || enums[regexResult[1]] || types[regexResult[1]];
            if(target) {
                const relPath = target.getRelativeFilePath(diagramPath);
                line = `<a id="${relPath}.${xmlEncode(target.name)}" xlink:href="${relPath}">${line}</a>`; 
            }
        }   
        arOut.push(line + '\n');
    }

    return arOut.join('');
}
