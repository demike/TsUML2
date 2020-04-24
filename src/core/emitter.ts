import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType } from "./interfaces";
import { templates }from "./templates";

export function emitSingleClass(name: string, properties: PropertyDetails[], methods: MethodDetails[]) {
    return templates.class(name, properties.map(escapePropertyDetials), methods.map(escapeMethodDetails));
}

export function emitSingleInterface(name: string, properties: PropertyDetails[], methods: MethodDetails[]) {
    return templates.interface(name, properties.map(escapePropertyDetials), methods.map(escapeMethodDetails));
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
function escape(str: string) {
    return str.replace(/[|\][]/g, '\\$&');
}

function escapeMethodDetails(details: MethodDetails) {
    if(details.returnType) {
        details.returnType = escape(details.returnType);
    }
    return details;
}

function escapePropertyDetials(details: PropertyDetails) {
    if(details.type) {
        details.type = escape(details.type);
    }
    return details;
}
