import * as SimpleAST from "ts-morph";
import { PropertyDetails, MethodDetails, HeritageClause, HeritageClauseType, Interface, Clazz, Enum, TypeAlias } from "../model";

export function getAst(tsConfigPath?: string, sourceFilesPathsGlob?: string) {
    const ast = new SimpleAST.Project({
        tsConfigFilePath: tsConfigPath,
        skipAddingFilesFromTsConfig: !!sourceFilesPathsGlob
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

    const sourceFile = classDeclaration.getSourceFile();
    let id = getTypeIdFromTypeName(sourceFile, className);

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

    return new Clazz({ name: className, properties, methods, id, heritageClauses: parseClassHeritageClauses(classDeclaration) });
}

export function parseInterfaces(interfaceDeclaration: SimpleAST.InterfaceDeclaration) {

    const interfaceName = getClassOrInterfaceName(interfaceDeclaration) || 'undefined';
    const propertyDeclarations = interfaceDeclaration.getProperties();
    const methodDeclarations = interfaceDeclaration.getMethods();

    const sourceFile = interfaceDeclaration.getSourceFile();
    let id = getTypeIdFromTypeName(sourceFile, interfaceName);
    if (!id.length) {
        console.error("missing interface id");
    }


    const properties = propertyDeclarations.map(parseProperty).filter((p) => p !== undefined) as PropertyDetails[];
    const methods = methodDeclarations.map(parseMethod).filter((p) => p !== undefined) as MethodDetails[];
  
    return new Interface({ name: interfaceName, properties, methods, id, heritageClauses: parseInterfaceHeritageClauses(interfaceDeclaration) });
}

export function parseTypes(typeDeclaration: SimpleAST.TypeAliasDeclaration) {

    const name = getClassOrInterfaceName(typeDeclaration) || 'undefined';
    const t = typeDeclaration.getType();
    const typeNode = typeDeclaration.getTypeNode();

    let propertyDeclarations: SimpleAST.PropertySignature[] = [];
    let methodDeclarations: SimpleAST.MethodSignature[] = [];

    if(typeNode instanceof SimpleAST.TypeLiteralNode) {
        propertyDeclarations = typeNode.getProperties();
        methodDeclarations = typeNode.getMethods();
    } else {
        // no structured type --> lets skip that (for now)
        return; 
    }
    
    const sourceFile = typeDeclaration.getSourceFile();
    let id = getTypeIdFromTypeName(sourceFile,name);

    if (!id.length) {
        console.error("missing type id");
    }

    const properties = propertyDeclarations.map(parseProperty).filter((p) => p !== undefined) as PropertyDetails[];
    const methods = methodDeclarations.map(parseMethod).filter((p) => p !== undefined) as MethodDetails[];


    return new TypeAlias({ name, id, methods, properties });
    
}

const optParameterEnding = " | undefined";
function parseProperty(propertyDeclaration: SimpleAST.PropertyDeclaration | SimpleAST.PropertySignature | SimpleAST.ParameterDeclaration) : PropertyDetails | undefined {
    const sym = propertyDeclaration.getSymbol();
    
    if (sym) {
        const prop = {            
            modifierFlags: propertyDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            type: getPropertyTypeName(sym),
            typeIds: getTypeIdsFromSymbol(sym),
            optional: propertyDeclaration.hasQuestionToken(),
        }

        if(prop.optional && prop.type && prop.type.endsWith(optParameterEnding)) {
            // in case of an optional property like myprop?: number --> remove the "| undefined" from the resulting "number | undefined"
            prop.type = prop.type.slice(0, prop.type.length - optParameterEnding.length);
        }
        return prop;
    }

}

function parseMethod(methodDeclaration: SimpleAST.MethodDeclaration | SimpleAST.MethodSignature) : MethodDetails | undefined{
    const sym = methodDeclaration.getSymbol();
    if (sym) {
        return {
            modifierFlags: methodDeclaration.getCombinedModifierFlags(),
            name: sym.getName(),
            returnType: getMethodReturnTypeName(methodDeclaration),
        }
    }
}

export function parseEnum(enumDeclaration: SimpleAST.EnumDeclaration) {
    const enumName = enumDeclaration.getSymbol()!.getName();

    const sourceFile = enumDeclaration.getSourceFile();
    let id = getTypeIdFromTypeName(sourceFile, enumName);
    if (!id.length) {
        console.error("missing class id");
    }

    let enumItems: string[] = []

    enumDeclaration.getMembers().forEach(mem => enumItems.push(mem.getName()))

    return new Enum({ name: enumName, id, enumItems });
}

export function parseClassHeritageClauses(classDeclaration: SimpleAST.ClassDeclaration ) {

    const className = getClassOrInterfaceName(classDeclaration);
    const classTypeId = getFullyQualifiedNameNormalized(classDeclaration.getSymbol()) ?? "";
    const baseClass =  classDeclaration.getBaseClass();
    const interfaces = classDeclaration.getImplements();
 
    
    let heritageClauses: HeritageClause[] = [];

    if(!className) {
        return heritageClauses;
    }

    if (className && baseClass) {
        const baseClassName = getClassOrInterfaceName(baseClass);
        if(baseClassName) {
            heritageClauses.push({
                        clause: baseClassName,
                        clauseTypeId: getFullyQualifiedNameNormalized(baseClass.getSymbol())!,
                        className,
                        classTypeId,
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
                    clauseTypeId: getTypeIdsFromType(interf.getType())?.[0]!,
                    className,
                    classTypeId,
                    type: HeritageClauseType.Implements
                }
            );
        }
    })

    return heritageClauses;
}

export function parseInterfaceHeritageClauses(interfaceDeclaration: SimpleAST.InterfaceDeclaration) {

    const ifName = getClassOrInterfaceName(interfaceDeclaration);
    const classTypeId = getFullyQualifiedNameNormalized(interfaceDeclaration.getSymbol()) ?? "";
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
                        clauseTypeId: getTypeIdsFromType(bd.getType())?.[0]!,
                        className: ifName,
                        classTypeId,
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

function getMethodReturnTypeName(method: SimpleAST.MethodSignature | SimpleAST.MethodDeclaration) {
    return getTypeAsString(method.getReturnType());
}

function getTypeAsString(type?: SimpleAST.Type<SimpleAST.ts.Type>): string | undefined {
    if(!type) {
        return undefined;
    }

    // might be a combination of types  MyType | undefined
    // getText and remove the import("abc.def.ts"). parts
    let name = type?.getText(undefined, SimpleAST.TypeFormatFlags.NoTypeReduction /* resolve 'default' to the actual type */);
    return name.replace(/import\([\d\D]*?\)\./g,''); //  TODO: potentially unnecessary
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

function getTypeIdsFromType(t?: SimpleAST.Type<SimpleAST.ts.Type>): string[] {
    if (!t) {
        return [];
    }

    let ids: (string|undefined)[] = [];

    if(t.isClassOrInterface()) {
        ids.push(getFullyQualifiedNameNormalized(t.getSymbol()));
    } else if (t.isEnum()) {
        ids.push(getFullyQualifiedNameNormalized(t.getSymbol()));    
    } else if (t.isUnionOrIntersection()) {
        ids = [...(t.getUnionTypes()), ...(t.getIntersectionTypes())].map(getTypeIdsFromType).flat();
       // throw new Error("not implemented");
    } else if (t.isArray()) {
        return getTypeIdsFromType(t.getTypeArguments()[0]);
       // throw new Error("not implemented");
    } else if (t.isAnonymous()) {
        // an anonymous type
        ids.push(getFullyQualifiedNameNormalized(t.getAliasSymbol()));
    } else if (t.isTypeParameter()) {
        return [];
        // throw new Error("not implemented");
    } else {
        if((t as any).getSymbol) {
            ids.push(getFullyQualifiedNameNormalized((t as SimpleAST.Type<SimpleAST.ts.Type>).getSymbol()));
        }
    }

    return ids.filter(id => id !== undefined) as string[] ;
}

function getClassOrInterfaceName(classOrIf: SimpleAST.ClassDeclaration | SimpleAST.InterfaceDeclaration | SimpleAST.TypeAliasDeclaration | SimpleAST.ExpressionWithTypeArguments | SimpleAST.Type ) {
    try {
        let name: string | undefined;
        let generics: string[] = [];
        if (classOrIf instanceof SimpleAST.ExpressionWithTypeArguments) {
            return classOrIf.getText();
        }

        if (classOrIf instanceof SimpleAST.Type) {
            name = classOrIf.getSymbol()?.getName();
            if(name === "__type" || name === undefined) {
                name = classOrIf.getAliasSymbol()!.getName();
            } else if(name === 'default') {
                const decl = classOrIf.getSymbol()?.getDeclarations()[0];
                if(decl && SimpleAST.Node.isInterfaceDeclaration( decl) || SimpleAST.Node.isClassDeclaration(decl)) {
                    name = decl.getName() ?? name;
                }
            }
            generics = classOrIf.getTypeArguments().map(arg => arg.getSymbol()!.getName());
        } else {
            //interface or class declaration or TypeAliasDeclaration
            if(!classOrIf.getTypeParameters) {
                return undefined; // some weird thing with mapped types i.e: Partial (TODO: investigate this further)
            }
            
            name = classOrIf.getName() ?? /* should not happen */classOrIf.getSymbol()!.getName();
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


/**
 * Returns a unique id for a type composed of the source file and the type name
 * in case the typeName is already a unique one that already starts with the source file. 
 * 
 * The output corresponds to getFullyQualifiedName() calls on exported types/interfaces/classes/enums
 * @param sourceFile 
 * @param typeName   name of the class, interface, type, enum ...
 */
function getTypeIdFromTypeName(sourceFile: SimpleAST.SourceFile, typeName: string ) {
    if(typeName.startsWith('"')) {
        //it is already a unique id starting with the source file
        return typeName;
    }
    return `"${sourceFile.getDirectoryPath()}/${sourceFile.getBaseNameWithoutExtension()}".${typeName}`;
}


/**
 * normalize the fully qualified name of a symbol to include the module path also for non-exported symbols
 * @param symbol 
 */
function getFullyQualifiedNameNormalized(symbol?: SimpleAST.Symbol) { 
    if(!symbol) {
        return;
    }
    let fullyQualifiedName = symbol.getFullyQualifiedName();
    if (!fullyQualifiedName.startsWith('"')) {
        const file = symbol.getDeclarations()[0].getSourceFile();
        fullyQualifiedName = getTypeIdFromTypeName(file,fullyQualifiedName);
    }
    return fullyQualifiedName;
}

