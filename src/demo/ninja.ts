import { Weapon, Gender } from "./interfaces";

interface Blockade {
    magic: number;
    physical: number;
}

export class Ninja {
    
    public gender: Gender = Gender.Else;
    public static IdCnt=0;
    position: {x: number, y: number} = {x: 0, y: 0};
    private _weapon: Weapon;
    protected secondaryWeapon?: Weapon;
    private blockade?: Blockade; // private interface test
    public id: number;
    public constructor(weapon: Weapon) {
        this.id = Ninja.IdCnt++;
        this._weapon = weapon;
    }
    public fight(fromDistance: number) {
        return this._weapon.tryHit(fromDistance);
    }
}
