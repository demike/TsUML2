import * as SimpleAST from "ts-morph";

import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType } from "./interfaces";

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

    return { className, properties, methods };
}

export function parseInterfaces(interfaceDeclaration: SimpleAST.InterfaceDeclaration) {

    const interfaceName = getClassOrInterfaceName(interfaceDeclaration) || 'undefined';
    const propertyDeclarations = interfaceDeclaration.getProperties();
    const methodDeclarations = interfaceDeclaration.getMethods();

    const properties = propertyDeclarations.map(parseProperty).filter((p) => p !== undefined) as PropertyDetails[];
    const methods = methodDeclarations.map(parseMethod).filter((p) => p !== undefined) as MethodDetails[];
  
    return { interfaceName, properties, methods };
}

function parseProperty(propertyDeclaration: SimpleAST.PropertyDeclaration | SimpleAST.PropertySignature | SimpleAST.ParameterDeclaration) : PropertyDetails | undefined {
    const sym = propertyDeclaration.getSymbol();
    
    if (sym) {
        return {            
            modifierFlags: propertyDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            type: getPropertyTypeName(sym),
        }
    }

}

function parseMethod(methodDeclaration: SimpleAST.MethodDeclaration | SimpleAST.MethodSignature) : MethodDetails | undefined{
    const sym = methodDeclaration.getSymbol();
    if (sym) {
        return {
            modifierFlags: methodDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            returnType: getMethodTypeName(methodDeclaration)
        }
    }
}

export function parseClassHeritageClauses(classDeclaration: SimpleAST.ClassDeclaration ) {

    const className = getClassOrInterfaceName(classDeclaration)
    const baseClass =  classDeclaration.getBaseClass();
    
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

    const implementors = interfaceDeclaration.getImplementations();
    implementors.forEach(impl => {
        const classDecl = impl.getSourceFile().getClass(impl.getNode().getText());
        let className: string| undefined;
        if (classDecl && (className = getClassOrInterfaceName(classDecl))) {

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

function getClassOrInterfaceName(classOrIf: SimpleAST.ClassDeclaration | SimpleAST.InterfaceDeclaration | SimpleAST.TypeAliasDeclaration | SimpleAST.ExpressionWithTypeArguments ) {
    try {
        let name: string;
        let generics: string[] = [];
        if (classOrIf instanceof SimpleAST.ExpressionWithTypeArguments) {
            return classOrIf.getText();
        }

        if(!classOrIf.getTypeParameters) {
            return undefined; // some weird thing with mapped types i.e: Partial (TODO: investigate this further)
        }
        name = classOrIf.getSymbol()!.getName();
        const typeParams = classOrIf.getTypeParameters();
        generics= typeParams.map((param) => param.getName()); 
        
        if (generics && generics.length) {
            name += "<" + generics.join(",") + ">";
        }

        return name;
    } catch(err) {
        console.log(err);
        return undefined;
    }
}

