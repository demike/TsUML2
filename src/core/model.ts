import { ModifierFlags } from "typescript";
import { relative, resolve, dirname } from "path";

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
    heritageClauses: HeritageClause[][];
}[]

export class Interface {
    public name: string;
    public id: string;
    properties: PropertyDetails[];
    methods: MethodDetails[];

    constructor(options: ClassOrIfOptions) {
        this.name = options.name;
        this.id = options.id;
        this.properties = options.properties;
        this.methods = options.methods;
    }

    getRelativeFilePath(fromFile: string) {
        const rx = /"(.*)"/;
        const result = rx.exec(this.id);
        if(!result) {
            throw new Error("Could not compute path to class / interface definition");
        }
        fromFile = resolve(dirname(fromFile));
        const toFile = resolve(result[1] + '.ts');
        
        
        let rel = relative(fromFile,toFile);
        
        return rel;
         
    }

}

export class Clazz extends Interface {

}


