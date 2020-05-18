import { PropertyDetails, MethodDetails} from "./model";
import { ModifierFlags } from "typescript";
import { SETTINGS } from "./tsuml2-settings";

export const templates = {
    composition: "+->",
    implements: (interf: string, implementation: string) => {
        return (
            `${templates.plainClassOrInterface(interf)}<:--${templates.plainClassOrInterface(implementation)}`
        );
    },
    extends: (base: string, derived: string) => {
      return `${templates.plainClassOrInterface(base)}<:-${templates.plainClassOrInterface(derived)}`;
    },
    plainClassOrInterface: (name: string) => `[${name}]`,
    colorClass: (name: string) => `[${name}]`,
    colorInterface: (name: string) => `[${name}]`,
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
    enum: (
        name: string,
        enumItems: string[]
    ) => {
      return `[<enumeration>${name}|${enumItems.join(";")}]`;
    }
};


function methodTemplate(method: MethodDetails): string {
    // TODO go on
    let retVal = method.name + "()";
    if (method.returnType && SETTINGS.propertyTypes) {
        retVal += ": " + method.returnType;
    }

    retVal = modifierTemplate(method.modifierFlags) + retVal;

    return retVal;
} 

function propertyTemplate(property: PropertyDetails): string {
    // TODO go on
    let retVal = property.name;
    if (property.type && SETTINGS.propertyTypes) {
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

    if(modifierFlags & ModifierFlags.Private) {
        retVal = "-" + retVal;
    } else if(modifierFlags & ModifierFlags.Protected) {
        retVal = "#" + retVal;
    } else {
        retVal = "+" + retVal;
    }

 

    return retVal;
}