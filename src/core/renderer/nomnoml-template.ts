import { PropertyDetails, MethodDetails, MemberAssociation} from "../model";
import { ModifierFlags } from "typescript";
import { SETTINGS } from "../tsuml2-settings";
import { Template } from "./template";

export const nomnomlTemplate: Template = {
    composition: "+->",
    implements: (interf: string, implementation: string) => {
        return (
            `${nomnomlTemplate.plainClassOrInterface(interf)}<:--${nomnomlTemplate.plainClassOrInterface(implementation)}`
        );
    },
    extends: (base: string, derived: string) => {
      return `${nomnomlTemplate.plainClassOrInterface(base)}<:-${nomnomlTemplate.plainClassOrInterface(derived)}`;
    },
    plainClassOrInterface: (name: string) => `[${name}]`,
    
    class: (name: string, props: PropertyDetails[], methods: MethodDetails[]) => {
        return `[${name}|${props.map(propertyTemplate).join(";")}|${methods.map(methodTemplate).join(";")}]`;
    },
    interface: (
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) => {
        return `[<interface>${name}|${props.map(propertyTemplate).join(";")}|${methods.map(methodTemplate).join(";")}]`;
    },
    type: (
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) => {
        return `[<type>${name}|${props.map(propertyTemplate).join(";")}|${methods.map(methodTemplate).join(";")}]`;
    },
    enum: (
        name: string,
        enumItems: string[]
    ) => {
      return `[<enumeration>${name}|${enumItems.join(";")}]`;
    },
    memberAssociation: memberAssociation
};

function methodTemplate(method: MethodDetails): string {
    method = escapeMethodDetails(method);

    let retVal = method.name + "()";
    if (method.returnType && SETTINGS.propertyTypes) {
        retVal += ": " + method.returnType;
    }

    retVal = modifierTemplate(method.modifierFlags) + retVal;

    return retVal;
} 

function propertyTemplate(property: PropertyDetails): string {
    property = escapePropertyDetails(property)

    let retVal = property.name;
    if (property.type && SETTINGS.propertyTypes) {
        if(property?.optional) {
            retVal += "?";
        }
        retVal += ": " + property.type;
        
    }

    retVal = modifierTemplate(property.modifierFlags) + retVal

    return retVal;
}

function modifierTemplate(modifierFlags: ModifierFlags): string {

    if (!SETTINGS.modifiers) {
        return "";
    }

    let retVal = "";

       // UML2: static member should be underlined --> Not supported by nomnoml 
    if(modifierFlags & ModifierFlags.Static) {
        retVal = "static " ;
    }

    if(modifierFlags & ModifierFlags.Abstract) {
        retVal = "abstract " ;
    }

    if(modifierFlags & ModifierFlags.Private) {
        retVal = "-" + retVal;
    } else if(modifierFlags & ModifierFlags.Protected) {
        retVal = "\\#" + retVal;
    } else {
        retVal = "+" + retVal;
    }

 

    return retVal;
}


function memberAssociation(association: MemberAssociation) {
    return `${nomnomlTemplate.plainClassOrInterface(association.a.name)} ${association.a.multiplicity ?? ''} - ${association.b.multiplicity ?? ''} ${nomnomlTemplate.plainClassOrInterface(association.b.name)}`;
}


// utility functions
function escapeNomnoml(str: string) {
    return str.replace(/[|\][\#]/g, '\\$&');
}


function escapeMethodDetails(details: MethodDetails) {
    if(details.returnType) {
        details.returnType = escapeNomnoml(details.returnType);
    }
    return details;
}

function escapePropertyDetails(details: PropertyDetails) {
    if(details.type) {
        details.type = escapeNomnoml(details.type);
    }
    return details;
}
