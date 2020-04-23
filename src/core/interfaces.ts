export interface MethodDetails {
    name: string;
    returnType?: string;
}

export interface PropertyDetails {
    name: string;
    type?: string;
}

export enum HeritageClauseType {
    Extends,
    Implements
}

export interface HeritageClause {
    clause: string;
    className: string;
    type: HeritageClauseType
}
