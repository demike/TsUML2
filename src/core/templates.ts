import { PropertyDetails, MethodDetails} from "./interfaces";
import { EmitterSettings } from "./emitter-settings";

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
    }
};


function methodTemplate(method: MethodDetails): string {
    if (method.returnType && EmitterSettings.emitPropertyTypes) {
        return method.name + "(): " + method.returnType
    }
    return method.name + '()';
} 

function propertyTemplate(property: PropertyDetails): string {
    if (property.type && EmitterSettings.emitPropertyTypes) {
        return property.name + ": " + property.type;
    }
    return property.name;
}