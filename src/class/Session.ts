import { InteractionResponse, Message, User } from "discord.js";
import { History } from './History';

export class Session {
    hostId: string;
    playerMap: Map<string, string>;
    
    turn: number;
    currentPlayer: User | undefined;

    messages: Map<string, Message | InteractionResponse>;
    history: Map<string, Array<History>>

    constructor(player: User) {
        this.hostId = player.id;
        this.playerMap = new Map().set(player.id, '');

        this.turn = Math.round(Math.random());

        this.messages = new Map();
        this.history = new Map();
    }
}