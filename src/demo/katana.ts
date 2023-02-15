import EquipmentPart from "./equipment";
import { Weapon, Named, MagicWeapon, Magic, BlackMagic, Durable, MagicDurability, Attribute as Attr } from "./interfaces";

export class BaseWeapon extends EquipmentPart<number> implements Durable {
    protected damage = 25;
    durability: number = 100;
    magicDurability: MagicDurability = {
        fire: 100,
        water: 100,
    }
    public attributes: Attr[] = [{id: "explosive", value: 10}, {id: "bouncing", value: 20}]; // Test member Alias (import as)
    refresh(): void {
       // DO Something 
    }
}

export class Katana extends BaseWeapon implements Weapon, Named  {
    name = "Katana";
    public tryHit(fromDistance: number) {
        return fromDistance <= 2;
    }

    public doIt() {}
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


// test alias
export interface AttributeWithDefault<T = any> extends Attr<T> {
    default: T;
}
