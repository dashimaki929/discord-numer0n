import * as dotenv from 'dotenv';
dotenv.config();

import { Client, GatewayIntentBits } from 'discord.js';

import { BotSetting, Sessions } from './typedef';
import { Session } from './Session';
import { commands } from './commands';
import { notificationReply, registSlashCommands } from './util';

const settings: BotSetting = { id: process.env.DISCORD_BOT_ID || '', token: process.env.DISCORD_BOT_TOKEN || '' };
const sessions: Sessions = {};

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
        const name = interaction.isCommand() ? interaction.commandName : interaction.customId;

        let session = sessions[interaction.channelId];

        // FIXME: Leave command-logic in here? If possible, would like to move this to commands.ts
        if (name === 'host') {
            if (session) {
                notificationReply(interaction, '既にゲームがホストされています。\n※１つのテキストチャンネルで１ゲームのみ立ち上げられます。');
                return;
            } else {
                session = new Session(interaction.user);
            }
        }

        if (!session) {
            notificationReply(interaction, 'ホストされているゲームがありません。');
            return;
        }

        sessions[interaction.channelId] ??= session;
        commands[name].execute(interaction, session);

        if (name === 'end') delete sessions[interaction.channelId];
    }
});

client.login(settings.token);
