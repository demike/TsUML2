import { Weapon, Named, MagicWeapon, Magic, BlackMagic } from "./interfaces";

export class BaseWeapon {
    damage = 25;
    protected durability: number = 100;
    public attributes: string[] = ["explosive", "bouncing"]
}

export class Katana extends BaseWeapon implements Weapon, Named  {
    name = "Katana";
    public tryHit(fromDistance: number) {
        return fromDistance <= 2;
    }
}

export class MagicKatana<MT extends Magic> extends Katana implements MagicWeapon<MT> {

    constructor(public magic: MT) {
        super();
    }

    tryMagicHit(): boolean {
        throw new Error("Method not implemented.");
    }

}

export class BlackMagicKatana extends MagicKatana<BlackMagic> implements MagicWeapon<BlackMagic> {
    tryBlackMagicHit(): boolean {
        throw new Error("Method not implemented.");
    }
}
