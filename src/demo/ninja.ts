import { Weapon, Gender } from "./interfaces";

export class Ninja {
    public gender: Gender = Gender.Else;
    public static IdCnt=0;
    private _weapon: Weapon;
    public id: number;
    public constructor(weapon: Weapon) {
        this.id = Ninja.IdCnt++;
        this._weapon = weapon;
    }
    public fight(fromDistance: number) {
        return this._weapon.tryHit(fromDistance);
    }
}