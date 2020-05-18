export interface Weapon {
    tryHit(fromDistance: number): boolean;
}

export interface Named {
    name: string;
}

export interface Magic {
    kind: string;
}

export interface BlackMagic extends Magic {
    paintItBlack(): boolean;
}

export interface MagicWeapon<MT extends Magic> extends Weapon {
    magic: MT;
    tryMagicHit(): boolean
}

export interface BlackMagicWeapon extends MagicWeapon<BlackMagic> {
    
}

export enum Gender {
    Male,
    Female,
    Else
}