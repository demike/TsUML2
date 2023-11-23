import { MemberAssociation, MethodDetails, PropertyDetails } from "../model"

export type Template = {
    composition: string,
    implements: (interf: string, implementation: string) => string,
    extends: (base: string, derived: string) => string,
    plainClassOrInterface: (name: string) => string,
 //   colorClass: (name: string) => string,
 //   colorInterface: (name: string) => string,
    class: (name: string, props: PropertyDetails[], methods: MethodDetails[]) => string,
    interface: (name: string, props: PropertyDetails[], methods: MethodDetails[]) => string,
    type: (name: string, props: PropertyDetails[], methods: MethodDetails[]) => string,
    enum: (name: string, enumItems: string[]) => string,
    memberAssociation: (association: MemberAssociation) => string
}