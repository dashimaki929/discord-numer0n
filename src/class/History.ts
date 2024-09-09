import { NUMBER_ICON } from "../common/constants";

export class History {
    guess: string;
    eat: number;
    bite: number;

    constructor(guess: string, eat: number, bite: number) {
        this.guess = guess;
        this.eat = eat;
        this.bite = bite;
    };

    toString(): string {
        return `${[...this.guess].map(n => NUMBER_ICON[Number(n)]).join(' ')} ： ${this.eat}EAT ， ${this.bite}BITE`;
    }
}