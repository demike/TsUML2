
import { MemberAssociation, MethodDetails, PropertyDetails } from '../model';
import { TsUML2Settings } from '../tsuml2-settings';
import { Template } from './template';
import { ts } from 'ts-morph';
export class  MermaidTemplate implements Template {
    public readonly composition = "+->";

    constructor(private settings: TsUML2Settings) {}

    public implements(interf: string, implementation: string) {
        return (
            `${this.plainClassOrInterface(interf)}<|..${this.plainClassOrInterface(implementation)}`
        );
    }

    public extends(base: string, derived: string) {
      return `${this.plainClassOrInterface(base)}<|--${this.plainClassOrInterface(derived)}`;
    }

    public plainClassOrInterface(name: string) { return escapeMermaid(name) }

    public class(name: string, props: PropertyDetails[], methods: MethodDetails[]) {
        return `class ${escapeMermaid(name)}{
            ${props.map(p => this.propertyTemplate(p)).join("\n")}
            ${methods.map(m => this.methodTemplate(m)).join("\n")}
        }`;
    }

    public interface(
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) {
        return `class ${escapeMermaid(name)} {
            <<interface>>
            ${props.map(p => this.propertyTemplate(p)).join("\n")}
            ${methods.map(m => this.methodTemplate(m)).join("\n")}
        }`;
    };

    public type(
        name: string,
        props: PropertyDetails[],
        methods: MethodDetails[]
    ) {
        return `class ${escapeMermaid(name)} {
            <<type>>
            ${props.map(p => this.propertyTemplate(p)).join("\n")}
            ${methods.map(m => this.methodTemplate(m)).join("\n")}
        }`;
    }

    public enum(
        name: string,
        enumItems: string[]
    ) {
      return `class ${escapeMermaid(name)} {
        <<enumeration>>
        ${enumItems.join("\n")}
      }`;
    }

    public memberAssociation(association: MemberAssociation) {
        const multiplicityA = association.a.multiplicity ? `"${association.a.multiplicity}"` : "";
        const multiplicityB = association.b.multiplicity ? `"${association.b.multiplicity}"` : "";
        return `${this.plainClassOrInterface(association.a.name)} ${multiplicityA} -- ${multiplicityB} ${this.plainClassOrInterface(association.b.name)}`;
    }

    private propertyTemplate(property: PropertyDetails): string {
        let retVal = property.name;
        if (property.type && this.settings.propertyTypes) {
            if(property?.optional) {
                retVal += "?";
            }
            retVal += ": " + escapeMermaid(property.type);
            
        }
    
        return this.applyModifiers(property.modifierFlags,retVal);
    }

    private methodTemplate(method: MethodDetails): string {
        let retVal = method.name + "()";
        if (method.returnType && this.settings.propertyTypes) {
            retVal += " " + escapeMermaid(method.returnType);
        }
    
        return this.applyModifiers(method.modifierFlags, retVal);
    }
    
    private applyModifiers(modifierFlags: ts.ModifierFlags, method: string): string {

        if (!this.settings.modifiers) {
            return method;
        }
    
        let retVal = "";
    
        if(modifierFlags & ts.ModifierFlags.Private) {
            retVal = "-" ;
        } else if(modifierFlags & ts.ModifierFlags.Protected) {
            retVal = "#";
        } else {
            retVal = "+";
        }
    
        retVal += method;
    
        // UML2: static member will be underlined 
        if(modifierFlags & ts.ModifierFlags.Static) {
            retVal = retVal + "$" ;
        }
    
        // abstract member will be italic
        if(modifierFlags & ts.ModifierFlags.Abstract) {
            retVal = retVal + "*" ;
        }
    
        return retVal;
    }
    
}

// utility functions
function escapeMermaid(str: string) {
    return str.replace(/[<>]/g,'~')
}