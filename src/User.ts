export class User {
    id: string;
    hand: [number?, number?, number?];

    constructor(id: string) {
        this.id = id;
        this.hand = [undefined, undefined, undefined]
    }
}
