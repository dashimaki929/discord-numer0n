import * as fs from 'fs';
import { ButtonInteraction, CommandInteraction, ModalSubmitInteraction, REST, Routes } from 'discord.js';

import { Commands, Command, BotSetting } from './typedef';

/**
 * Converts full-width numbers to half-width numbers
 * 
 * @param digit
 * @returns halfWidthDigit
 */
export function toHalfWidthDigit(digit: string): string {
    return digit.replace(/[０-９]/g, c => {
        return String.fromCharCode(c.charCodeAt(0) - 0xFEE0);
    })
}

/**
 * Judge the results of player's guess.
 * 
 * @param guess 
 * @param hand 
 * @returns judgementResult
 */
export function judgeNumber(guess: string, hand: string): {eat: number, bite: number} {
    const eat = [...guess].filter((n, i) => n === hand[i]).length
    const bite = [...guess].filter(n => hand.includes(n)).length - eat;
    
    return { eat, bite };
}

/**
 * Read file as text
 *
 * @param filepath
 * @returns data
 */
export function readFile(filepath: string): string {
    let data = '';

    try {
        data = fs.readFileSync(filepath, 'utf-8');
        console.debug(data);
    } catch (e) {
        console.error(e);
    }

    return data;
}

/**
 * Register slash-commands
 * 
 * @param commands 
 * @param setting 
 */
export async function registSlashCommands(commands: Commands, setting: BotSetting): Promise<void> {
    const rest = new REST({ version: '10' }).setToken(setting.token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(setting.id), {
            body: Object.keys(commands)
                .filter((name) => commands[name].description)
                .map((name) => {
                    const command: Command = commands[name];
                    return {
                        name,
                        description: command.description,
                        options: command.options
                    };
                })
        });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.log('[ERROR]', error);
    }
}

export async function notificationReply(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, content: string): Promise<void> {
    await interaction.reply({ content, ephemeral: true }).then(msg => {
        setTimeout(() => {
            msg.delete();
        }, 3000);
    })
}
