import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType } from "./interfaces";
import { templates }from "./templates";

export function emitSingleClass(name: string, properties: PropertyDetails[], methods: MethodDetails[]) {
    return templates.class(name, properties, methods);
}

export function emitSingleInterface(name: string, properties: PropertyDetails[], methods: MethodDetails[]) {
    return templates.interface(name, properties, methods);
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
