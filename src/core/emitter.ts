import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType, Clazz, Interface, FileDeclaration, Enum } from "./model";
import { templates }from "./templates";


export function emitSingleClass(cls: Clazz) {
    return templates.class(cls.name, cls.properties.map(escapePropertyDetails), cls.methods.map(escapeMethodDetails));
}

export function emitSingleInterface(int: Interface) {
    return templates.interface(int.name, int.properties.map(escapePropertyDetails), int.methods.map(escapeMethodDetails));
}

export function emitSingleEnum(en: Enum) {
    return templates.enum(en.name, en.items);
}
  
export function emitHeritageClauses(heritageClauses: HeritageClause[]) {
    return heritageClauses.map((heritageClause) => {
        if(heritageClause.type === HeritageClauseType.Extends) {
           return templates.extends(heritageClause.clause, heritageClause.className);
        } else {
           return templates.implements(heritageClause.clause, heritageClause.className);
        }

    });
}

// utility functions
function escapeNomnoml(str: string) {
    return str.replace(/[|\][]/g, '\\$&');
}

function xmlEncode(str: string) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function escapeMethodDetails(details: MethodDetails) {
    if(details.returnType) {
        details.returnType = escapeNomnoml(details.returnType);
    }
    return details;
}

function escapePropertyDetails(details: PropertyDetails) {
    if(details.type) {
        details.type = escapeNomnoml(details.type);
    }
    return details;
}


export function postProcessSvg(svg: string, diagramPath: string, declarations: FileDeclaration[]) {
    const classes: {[key:string]:Clazz} = {};
    const interfaces: {[key:string]:Interface} = {};
    const enums: {[key: string]:Enum} = {};

    declarations.map(d => {
        d.classes.forEach(cls => classes[xmlEncode(cls.name)] = cls)
        d.interfaces.forEach(i => interfaces[xmlEncode(i.name)] = i)
        d.enums.forEach(e => enums[xmlEncode(e.name)] = e);
    });
   
    const rx = />(.*)</;
    const arOut = []
    let regexResult: RegExpExecArray | null;
    for(let line of svg.split('\n')) {
        line = line.trim();
        if(line.startsWith("<text") && (regexResult = rx.exec(line))) {
            let target = classes[regexResult[1]] || interfaces[regexResult[1]] || enums[regexResult[1]];
            if(target) {
                const relPath = target.getRelativeFilePath(diagramPath);
                line = `<a id="${relPath}.${xmlEncode(target.name)}" xlink:href="${relPath}">${line}</a>`; 
            }
        }   
        arOut.push(line + '\n');
    }

    return arOut.join('');
}
