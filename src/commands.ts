import {
    CommandInteraction,
} from 'discord.js';

import { Commands } from './typedef';

export const commands: Commands = {
    ping: {
        description: '🔌 疎通確認',
        options: [],
        execute: async (interaction: CommandInteraction) => {
            await interaction.reply('Pong!');
        },
    }
}