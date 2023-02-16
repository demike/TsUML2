import EquipmentPart from "./equipment";
import { Weapon, Gender, BlackMagic as BM } from "./interfaces";
import { Katana, MagicKatana as MK } from "./katana";


export class Viking<WT extends Weapon> {
    public age: (10 | 20)[] = [];
    public gender: Gender = Gender.Else;
    public weapon: WT
    public constructor(weapon: WT) {
        this.weapon = weapon;
    }
    public fight(fromDistance: number) {
        return this.weapon.tryHit(fromDistance);
    }

    public bag: EquipmentPart<any>[] = [];

}

export class UberViking<WT extends Weapon> extends Viking<WT> {
    belt?: EquipmentPart<any>;
}

export class VikingWithKatana extends Viking<Katana> {

}

// Alias Test
export class MagicViking extends Viking<MK<BM>> {
    public secondaryWeapon?: MK<BM>;
}