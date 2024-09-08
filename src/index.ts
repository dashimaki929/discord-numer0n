import * as dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';

import { BotSetting, Sessions } from './typedef';
import { Session } from './Session';
import { commands } from './commands';
import { registSlashCommands } from './util';

const settings: BotSetting = { id: process.env.DISCORD_BOT_ID || '', token: process.env.DISCORD_BOT_TOKEN || '' };
const Sessions: Sessions = {};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    await registSlashCommands(commands, settings);

    console.log('Bot "discord-numer0n" has successfully started!');
});

client.on('interactionCreate', interaction => {
    if (!interaction.channelId) return;

    if (interaction.isCommand() || interaction.isButton() || interaction.isModalSubmit()) {
        const session = Sessions[interaction.channelId] ?? new Session();
        Sessions[interaction.channelId] ??= session;

        const name = interaction.isCommand() ? interaction.commandName : interaction.customId;
        commands[name].execute(interaction, session);

        // if (name === 'end') delete Sessions[interaction.channelId];
    }
});

client.login(settings.token);
