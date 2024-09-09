import { User } from "discord.js";

export class Session {
    hostId: string;
    playerMap: Map<string, string>;
    
    turn: number;
    currentPlayer: User | undefined;

    constructor(player: User) {
        this.hostId = player.id;
        this.playerMap = new Map().set(player.id, '');

        this.turn = Math.round(Math.random());
        this.currentPlayer = player;
    }
}