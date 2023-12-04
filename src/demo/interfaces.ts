export interface Weapon {
    tryHit(fromDistance: number): boolean;
}

export interface Named {
    name: string;
}

export interface Magic {
    kind: string;
}

export type MagicDurability = {
    fire: number;
    water: number
}

export type Durable = {
    durability: number;
    magicDurability: MagicDurability;
    refresh(): void;
}

export interface BlackMagic extends Magic {
    paintItBlack(): boolean;
}

export interface MagicWeapon<MT extends Magic> extends Weapon {
    magic: MT;
    tryMagicHit(): boolean
}

export interface BlackMagicWeapon extends MagicWeapon<BlackMagic> {
    spells: string;
}


export enum Gender {
    Male,
    Female,
    Else
}

export interface Attribute<T = any> {
    id: string;
    value: T;
    description?: string;
}

// for testing default exports
export default interface Mountable<T = any> {
    mount(): void;
    unmount(): void;
}