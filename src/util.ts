import * as fs from 'fs';
import { ButtonInteraction, CommandInteraction, ModalSubmitInteraction, REST, Routes } from 'discord.js';

import { Commands, Command, BotSetting } from './typedef';

/**
 * Read file as text
 *
 * @param filepath
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
export async function registSlashCommands(commands: Commands, setting: BotSetting) {
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

export async function notificationReply(interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction, content: string) {
    await interaction.reply({ content, ephemeral: true }).then(msg => {
        setTimeout(() => {
            msg.delete();
        }, 2000);
    })
}
