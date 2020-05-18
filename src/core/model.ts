import { ModifierFlags } from "typescript";
import { relative, resolve, dirname } from "path";
import chalk = require("chalk");

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


export interface ClassOrIfOptions {
    name: string,
    id: string,
    properties: PropertyDetails[],
    methods: MethodDetails[]
}

export interface FileDeclaration {
    /**
     * file name including path
     */
    fileName: string;
    classes: Clazz[];
    interfaces: Interface[];
    enums: Enum[];
    heritageClauses: HeritageClause[][];
}[]

export class NamedType {
    public name: string;
    public id: string;

    constructor(options: {name: string, id: string}) {
        this.name = options.name;
        this.id = options.id;
    }

    getRelativeFilePath(fromFile: string) {
        const rx = /"(.*)"/;
        const result = rx.exec(this.id);
        if(!result) {
            console.log(chalk.redBright("Could not compute path to class / interface definition: " + this.id));
            return "";
        }
        fromFile = resolve(dirname(fromFile));
        const toFile = resolve(result[1] + '.ts');
        
        
        let rel = relative(fromFile,toFile);
        
        return rel;
         
    }
}

export class Interface extends NamedType {

    properties: PropertyDetails[];
    methods: MethodDetails[];

    constructor(options: ClassOrIfOptions) {
        super(options)
        this.properties = options.properties;
        this.methods = options.methods;
    }

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


