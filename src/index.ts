import { Client, GatewayIntentBits } from 'discord.js';

import { Settings } from './typedef';
import { commands } from './commands';
import { readFile, registSlashCommands } from './util';

const settings: Settings = JSON.parse(readFile('./config/settings.json'));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
    await registSlashCommands(commands, settings.bot);

    console.log('Bot "discord-numer0n" has successfully started!');
});

client.on('interactionCreate', interaction => {
    if (interaction.isCommand()) {
        commands[interaction.commandName].execute(interaction);
    } else if (interaction.isButton() || interaction.isModalSubmit()) {
        commands[interaction.customId].execute(interaction);
    }
});

client.login(settings.bot.token);
