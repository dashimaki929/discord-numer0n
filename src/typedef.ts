import { CommandInteraction, ButtonInteraction, ModalSubmitInteraction } from 'discord.js';
import { Session } from './Session';

export type Settings = {
    bot: BotSetting;
}

export type BotSetting = {
    id: string;
    token: string;
}

export type Commands = {
    [key: string]: Command;
}

export type Command = {
    description: string;
    options: CommandOption[];
    execute(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, session: Session): void;
}

export type CommandOption = {
    type: number;
    name: string;
    description: string;
    choices: CommandOptionChoice[];
    required: boolean;
}

export type CommandOptionChoice = {
    name: string;
    value: string;
}

export type Sessions = {
    [key: string]: Session;
}
