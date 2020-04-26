import { ModifierFlags } from "typescript";

export interface MemberDetails {
    modifierFlags: ModifierFlags;
    name: string;
}

export interface MethodDetails extends MemberDetails{
 
    returnType?: string;
}

export interface PropertyDetails extends MemberDetails {
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
