export interface Weapon {
    tryHit(fromDistance: number): boolean;
}

export interface Named {
    name: string;
}

export interface Magic {
    kind: string;
}

export interface MagicWeapon<MT extends Magic> extends Weapon {
    magic: MT;
    tryMagicHit(): boolean
}