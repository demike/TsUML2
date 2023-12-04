
import { ModifierFlags } from 'typescript';
import { MemberAssociation, MethodDetails, PropertyDetails } from '../model';
import { SETTINGS } from '../tsuml2-settings';
import { Template } from './template';
export const  mermaidTemplate: Template = {
    composition: "+->",
    implements: (interf: string, implementation: string) => {
        return (
            `${mermaidTemplate.plainClassOrInterface(interf)}<|..${mermaidTemplate.plainClassOrInterface(implementation)}`
        );
    },
    extends: (base: string, derived: string) => {
      return `${mermaidTemplate.plainClassOrInterface(base)}<|--${mermaidTemplate.plainClassOrInterface(derived)}`;
    },
    plainClassOrInterface: (name: string) => escapeMermaid(name),
    class: (name: string, props: PropertyDetails[], methods: MethodDetails[]) => {
        return `class ${escapeMermaid(name)}{
            ${props.map(propertyTemplate).join("\n")}
            ${methods.map(methodTemplate).join("\n")}
        }`;
    },
    interface: (
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) => {
        return `class ${escapeMermaid(name)} {
            <<interface>>
            ${props.map(propertyTemplate).join("\n")}
            ${methods.map(methodTemplate).join("\n")}
        }`;
    },
    type: (
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) => {
        return `class ${escapeMermaid(name)} {
            <<type>>
            ${props.map(propertyTemplate).join("\n")}
            ${methods.map(methodTemplate).join("\n")}
        }`;
    },
    enum: (
        name: string,
        enumItems: string[]
    ) => {
      return `class ${escapeMermaid(name)} {
        <<enumeration>>
        ${enumItems.join("\n")}
      }`;
    },
    memberAssociation: memberAssociation
};

function propertyTemplate(property: PropertyDetails): string {
    let retVal = property.name;
    if (property.type && SETTINGS.propertyTypes) {
        if(property?.optional) {
            retVal += "?";
        }
        retVal += ": " + escapeMermaid(property.type);
        
    }

    return applyModifiers(property.modifierFlags,retVal);
}


function methodTemplate(method: MethodDetails): string {
    let retVal = method.name + "()";
    if (method.returnType && SETTINGS.propertyTypes) {
        retVal += " " + escapeMermaid(method.returnType);
    }

    return applyModifiers(method.modifierFlags, retVal);
} 


function applyModifiers(modifierFlags: ModifierFlags, method: string): string {

    if (!SETTINGS.modifiers) {
        return method;
    }

    let retVal = "";

    if(modifierFlags & ModifierFlags.Private) {
        retVal = "-" ;
    } else if(modifierFlags & ModifierFlags.Protected) {
        retVal = "#";
    } else {
        retVal = "+";
    }

    retVal += method;

    // UML2: static member will be underlined 
    if(modifierFlags & ModifierFlags.Static) {
        retVal = retVal + "$" ;
    }

    // abstract member will be italic
    if(modifierFlags & ModifierFlags.Abstract) {
        retVal = retVal + "*" ;
    }

    return retVal;
}

function memberAssociation(association: MemberAssociation) {
    const multiplicityA = association.a.multiplicity ? `"${association.a.multiplicity}"` : "";
    const multiplicityB = association.b.multiplicity ? `"${association.b.multiplicity}"` : "";
    return `${mermaidTemplate.plainClassOrInterface(association.a.name)} ${multiplicityA} -- ${multiplicityB} ${mermaidTemplate.plainClassOrInterface(association.b.name)}`;
}

// utility functions
function escapeMermaid(str: string) {
    return str.replace(/[<>]/g,'~')
}