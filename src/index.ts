import { Client, GatewayIntentBits } from 'discord.js';

import { Settings, Sessions } from './typedef';
import { Session } from './Session';
import { commands } from './commands';
import { readFile, registSlashCommands } from './util';

const settings: Settings = JSON.parse(readFile('./config/settings.json'));
const Sessions: Sessions = {};

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    await registSlashCommands(commands, settings.bot);

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

client.login(settings.bot.token);
