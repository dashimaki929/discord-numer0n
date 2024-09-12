import { InteractionResponse, Message, User } from "discord.js";
import { Result } from './Result';

export class Session {
    hostId: string;
    players: Map<string, string>;
    
    turn: number;
    currentPlayer: User | undefined;

    messages: Map<string, Message | InteractionResponse>;
    histories: Map<string, Array<Result>>

    constructor(hostId: string) {
        this.hostId = hostId;
        this.players = new Map().set(hostId, '');

        this.turn = Math.round(Math.random());

        this.messages = new Map();
        this.histories = new Map();
    }
}