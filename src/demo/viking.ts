import { Weapon, Gender } from "./interfaces";
import { Katana } from "./katana";

export class Viking<WT extends Weapon> {
    public gender: Gender = Gender.Else;
    public weapon: WT
    public constructor(weapon: WT) {
        this.weapon = weapon;
    }
    public fight(fromDistance: number) {
        return this.weapon.tryHit(fromDistance);
    }

}

export class UberViking<WT extends Weapon> extends Viking<WT> {

}

export class VikingWithKatana extends Viking<Katana> {

}