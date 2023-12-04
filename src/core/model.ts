import { ModifierFlags } from "typescript";
import { relative, resolve, dirname } from "path";
import chalk from "chalk";

export interface MemberDetails {
    modifierFlags: ModifierFlags;
    name: string;
}

export interface MethodDetails extends MemberDetails{
 
    returnType?: string;
    returnTypeIds?: string[];
}

export interface PropertyDetails extends MemberDetails {
    type?: string;
    typeIds: string[];
    optional: boolean;
}

export enum HeritageClauseType {
    Extends,
    Implements
}

export interface HeritageClause {
    clause: string;
    clauseTypeId: string
    className: string;
    classTypeId: string;
    type: HeritageClauseType;
}


export interface ClassOrIfOptions {
    name: string,
    id: string,
    properties: PropertyDetails[],
    methods: MethodDetails[],
    heritageClauses?: HeritageClause[]
}

export interface FileDeclaration {
    /**
     * file name including path
     */
    fileName: string;
    classes: Clazz[];
    interfaces: Interface[];
    enums: Enum[];
    types: TypeAlias[];
    heritageClauses: HeritageClause[][];
    memberAssociations?: MemberAssociation[];
}[]

export class NamedType {
    public name: string;
    public id: string;

    constructor(options: {name: string, id: string}) {
        this.name = options.name;
        this.id = options.id;
    }

    getRelativeFilePath(fromFile?: string | null) {
        const rx = /"(.*)"/;
        const result = rx.exec(this.id);
        if(!result) {
            console.log(chalk.redBright("Could not compute path to class / interface definition: " + this.id));
            return "";
        }

        const toFile = resolve(result[1] + '.ts');
        if(!fromFile) {
            // return the absolute path if no fromFile is given
            return toFile;
        }
        fromFile = resolve(dirname(fromFile));
        let rel = relative(fromFile,toFile);
        
        return rel;
         
    }
}

export class Interface extends NamedType {

    properties: PropertyDetails[];
    methods: MethodDetails[];
    heritageClauses: HeritageClause[];

    constructor(options: ClassOrIfOptions) {
        super(options)
        this.properties = options.properties;
        this.methods = options.methods;
        this.heritageClauses = options.heritageClauses || [];
    }

}

export class TypeAlias extends Interface {

}

export class Clazz extends Interface {

}

export interface EnumOptions {
    name: string,
    id: string,
    enumItems: string[]
}
export class Enum extends NamedType {
    items: string[] = [];

    constructor(options: EnumOptions) {
        super(options);
        this.items = options.enumItems
    }

}



export enum AssociationType {
    Association
}
export class MemberAssociation {
    constructor(
        public readonly a: AssociationEnd, 
        public readonly b: AssociationEnd, 
        public readonly associationType: AssociationType = AssociationType.Association,
        public inerhited = false) {}
}

export interface AssociationEnd {
    typeId: string;
    name:string
    multiplicity?: "0..*"|undefined;
}


