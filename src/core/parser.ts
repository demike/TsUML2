import * as SimpleAST from "ts-morph";

import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType, Interface, Clazz, Enum } from "./model";


export function getAst(tsConfigPath: string, sourceFilesPathsGlob?: string) {
    const ast = new SimpleAST.Project({
        tsConfigFilePath: tsConfigPath,
        addFilesFromTsConfig: !sourceFilesPathsGlob
    });
    if (sourceFilesPathsGlob) {
        ast.addSourceFilesAtPaths(sourceFilesPathsGlob);
    }
    return ast;
}

export function parseClasses(classDeclaration: SimpleAST.ClassDeclaration) {
    
    const className = getClassOrInterfaceName(classDeclaration) || "undefined";
    const propertyDeclarations = classDeclaration.getProperties();
    const methodDeclarations = classDeclaration.getMethods();
    const ctors = classDeclaration.getConstructors();

    let id = classDeclaration.getSymbol()?.getFullyQualifiedName() ?? "";
    if (!id.length) {
        console.error("missing class id");
    }

    let properties = propertyDeclarations.map(parseProperty).filter((p) => p !== undefined) as PropertyDetails[];

    if (ctors && ctors.length) {
        //find the properties declared by using a modifier before a constructor paramter
        const ctorProperties =
            ctors[0].getParameters().map(param => {
                if(!param.getModifiers().length) {
                    return undefined; 
                }
                return parseProperty(param);
            }).filter(p => p !== undefined) as PropertyDetails[];
        properties.push(...ctorProperties);
    }

    const methods = methodDeclarations.map(parseMethod).filter((p) => p !== undefined) as MethodDetails[];

    return new Clazz({ name: className, properties, methods, id });
}

export function parseInterfaces(interfaceDeclaration: SimpleAST.InterfaceDeclaration) {

    const interfaceName = getClassOrInterfaceName(interfaceDeclaration) || 'undefined';
    const propertyDeclarations = interfaceDeclaration.getProperties();
    const methodDeclarations = interfaceDeclaration.getMethods();

    let id = interfaceDeclaration.getSymbol()?.getFullyQualifiedName() ?? "";
    if (!id.length) {
        console.error("missing interface id");
    }


    const properties = propertyDeclarations.map(parseProperty).filter((p) => p !== undefined) as PropertyDetails[];
    const methods = methodDeclarations.map(parseMethod).filter((p) => p !== undefined) as MethodDetails[];
  
    return new Interface({ name: interfaceName, properties, methods, id });
}

function parseProperty(propertyDeclaration: SimpleAST.PropertyDeclaration | SimpleAST.PropertySignature | SimpleAST.ParameterDeclaration) : PropertyDetails | undefined {
    const sym = propertyDeclaration.getSymbol();
    
    if (sym) {
        return {            
            modifierFlags: propertyDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            type: getPropertyTypeName(sym),
            typeIds: getTypeIdsFromSymbol(sym)
        }
    }

}

function parseMethod(methodDeclaration: SimpleAST.MethodDeclaration | SimpleAST.MethodSignature) : MethodDetails | undefined{
    const sym = methodDeclaration.getSymbol();
    if (sym) {
        return {
            modifierFlags: methodDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            returnType: getMethodTypeName(methodDeclaration),
        }
    }
}

export function parseEnum(enumDeclaration: SimpleAST.EnumDeclaration) {
    const enumName = enumDeclaration.getSymbol()!.getName();

    let id = enumDeclaration.getSymbol()?.getFullyQualifiedName() ?? "";
    if (!id.length) {
        console.error("missing class id");
    }

    let enumItems: string[] = []

    enumDeclaration.getMembers().forEach(mem => enumItems.push(mem.getName()))

    return new Enum({ name: enumName, id, enumItems });
}

export function parseClassHeritageClauses(classDeclaration: SimpleAST.ClassDeclaration ) {

    const className = getClassOrInterfaceName(classDeclaration)
    const baseClass =  classDeclaration.getBaseClass();
    const interfaces = classDeclaration.getImplements();
 
    
    let heritageClauses: HeritageClause[] = [];

    if(!className) {
        return heritageClauses;
    }

    if (className && baseClass) {
        const baseClassName = getClassOrInterfaceName(baseClass)
        if(baseClassName) {
            heritageClauses.push({
                        clause: baseClassName,
                        className,
                        type: HeritageClauseType.Extends
            });
        }
    }

    // the implemented interfaces
    interfaces.forEach(interf => {
       let ifName: string| undefined;
       const type = interf.getType();
       const targetType =  type.getTargetType();
        if (interf && (ifName = getClassOrInterfaceName(targetType || type))) {

            heritageClauses.push(
                {
                    clause: ifName,
                    className,
                    type: HeritageClauseType.Implements
                }
            );
        }
    })

    return heritageClauses;
}

export function parseInterfaceHeritageClauses(interfaceDeclaration: SimpleAST.InterfaceDeclaration) {

    const ifName = getClassOrInterfaceName(interfaceDeclaration)
    const baseDeclarations =  interfaceDeclaration.getBaseDeclarations();

    let heritageClauses: HeritageClause[] = [];

    if(!ifName) {
        return heritageClauses;
    }

    if (baseDeclarations) {
        baseDeclarations.forEach(bd => {
            const bdName = getClassOrInterfaceName(bd);
            if (bdName) {
                heritageClauses.push(
                    {
                        clause: bdName,
                        className: ifName,
                        type: HeritageClauseType.Implements
                    }
                );
            }
        });
    }

    return heritageClauses;
}


// utility functions

function getPropertyTypeName(propertySymbol: SimpleAST.Symbol) {
    const t = propertySymbol.getValueDeclaration()?.getType();
    if (!t) {
        return undefined;
    }
    return getTypeAsString(t);
}

function getMethodTypeName(method: SimpleAST.MethodSignature | SimpleAST.MethodDeclaration) {
    return getTypeAsString(method.getReturnType());
}

function getTypeAsString(type?: SimpleAST.Type<SimpleAST.ts.Type>): string | undefined {
    if(!type) {
        return undefined;
    }

    let name;
    if( type.isArray()) {
        const typeArgs = type.getTypeArguments();
        if(typeArgs.length > 0) {
            let elType = type.getTypeArguments()[0];
            name = getTypeAsString(elType);
        }
        
        if(name) {
            return name + "[]"
        }
        return "[]"
        
    } else {
        // might be a combination of types  MyType | undefined
        // getText and remove the import("abc.def.ts"). parts
        name = type?.getText();
        name = name.replace(/import\([\d\D]*?\)\./g,'');
    }

    return name;
}

/**
 * return an array of type ids (array because of union / intersection)
 * @param symbol returns undefined if simple type number ...
 */
function getTypeIdsFromSymbol(symbol: SimpleAST.Symbol) : string[] {
   
    let valueDecl = symbol.getValueDeclaration();
    if (!valueDecl) {
        return [];
    }
    let type = valueDecl.getType();
    return getTypeIdsFromType(type);

}

function getTypeIdsFromType(type?: SimpleAST.Type<SimpleAST.ts.Type>): string[] {
    if (!type) {
        return [];
    }

    let ids: (string|undefined)[] = [];

    if(type.isClassOrInterface()) {
        ids.push(type.getSymbol()?.getFullyQualifiedName());
    } else if (type.isEnum()) {
        ids.push(type.getSymbol()?.getFullyQualifiedName());;     
    } else if (type.isUnionOrIntersection()) {
        return [];
        throw new Error("not implemented");
    } else if (type.isArray()) {
        return getTypeIdsFromType(type.getTypeArguments()[0]);
        throw new Error("not implemented");
    } else if (type.isTypeParameter()) {
        return [];
        // throw new Error("not implemented");
    }

    return ids.filter(id => id !== undefined) as string[] ;
}

function getClassOrInterfaceName(classOrIf: SimpleAST.ClassDeclaration | SimpleAST.InterfaceDeclaration | SimpleAST.TypeAliasDeclaration | SimpleAST.ExpressionWithTypeArguments | SimpleAST.Type ) {
    try {
        let name: string;
        let generics: string[] = [];
        if (classOrIf instanceof SimpleAST.ExpressionWithTypeArguments) {
            return classOrIf.getText();
        }

        if (classOrIf instanceof SimpleAST.Type) {
            name = classOrIf.getSymbol()!.getName();
            generics = classOrIf.getTypeArguments().map(arg => arg.getSymbol()!.getName());
        } else {
            //interface or class declaration or TypeAliasDeclaration
            if(!classOrIf.getTypeParameters) {
                return undefined; // some weird thing with mapped types i.e: Partial (TODO: investigate this further)
            }
            name = classOrIf.getSymbol()!.getName();
            generics= classOrIf.getTypeParameters().map((param) => param.getName()); 
        }
        
    
        
        if (generics && generics.length) {
            name += "<" + generics.join(",") + ">";
        }

        return name;
    } catch(err) {
        console.log(err);
        return undefined;
    }
}

