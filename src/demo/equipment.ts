import Mountable from "./interfaces";

// for testing default exports
export default class EquipmentPart<T> implements Mountable<T> {
    public id: string = "none";
    public readonly name?: string;
    public content?: T;

    mount(): void {
        // Do it!
    }
    unmount(): void {
        // Do it!
    }
}
