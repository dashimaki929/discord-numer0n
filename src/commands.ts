import {
    EmbedBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ButtonInteraction,
    CommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ModalSubmitInteraction
} from 'discord.js';

import { Commands } from './typedef';
import { User } from './User';
import { notificationReply } from './util';

const MAX_USER_COUNT = 2;
const NUMBER_ICON = [':zero:', ':one:', ':two:', ':three:', ':four:', ':five:', ':six:', ':seven:', ':eight:', ':nine:'];

export const commands: Commands = {
    debug: {
        description: '🔧 デバッグ',
        options: [],
        execute: async (interaction: CommandInteraction, session) => {
            await interaction.reply(`\`\`\`json\n${JSON.stringify(session, null, '\t')}\n\`\`\``);
        }
    },
    host: {
        description: '🟢 ゲームをホスト',
        options: [],
        execute: async (interaction: CommandInteraction, session) => {
            if (session.hostUserId) {
                notificationReply(interaction, '既にゲームがホストされています。\n※１つのテキストチャンネルで１ゲームのみ立ち上げられます。');
                return;
            }

            const userId = interaction.user.id;
            session.hostUserId = userId;
            session.userList.push(new User(userId));

            await interaction.reply({
                files: [
                    new AttachmentBuilder('./img/banner.png').setName('banner.png')
                ],
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xed04eb)
                        .setAuthor({ name: `${interaction.user.displayName} がゲームをホストしました！`, iconURL: interaction.user.displayAvatarURL() })
                        .setTitle('知的数字ゲーム「NumerØn」')
                        .setDescription('2人のプレイヤーが互いの指定した数字を当てる知的ゲーム。')
                        .setImage('attachment://banner.png')
                        .addFields({
                            name: '📖 ルール',
                            value: [
                                'それぞれのプレイヤーが、0-9までの数字を用いて、3桁の番号を作成する。\n「084」のように上一桁が「0」の番号も作成可能性であるが、同じ数字を2つ以上用いた番号は作れない。',
                                '先攻のプレイヤーは相手の番号を推理してコールする。数字と桁が合っていた場合は「EAT」（イート）、数字は合っているが桁は合っていない場合は「BITE」（バイト）となる。',
                                'これを先攻・後攻が繰り返して行い、先に相手の番号を完全に当てきった（3桁戦なら3EATを相手に発表させた）プレイヤーの勝利となる。'
                            ].join('\n')
                        })
                        .addFields({
                            name: '🧰 アイテム',
                            value: '攻撃系アイテムと防御系アイテムがあり、同一ターンではそれぞれ1つずつのみ使用可能である。使用の際はアイテムボタンを押して使用するアイテムを宣言する。',
                            inline: true
                        }),
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('join').setLabel('ゲームに参加する').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setLabel('詳細ルール').setURL('https://ja.wikipedia.org/wiki/Numer0n#ルール').setStyle(ButtonStyle.Link)
                    )
                ],
            });
        }
    },
    join: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction, session) => {
            if (!session.hostUserId) {
                notificationReply(interaction, 'ホストされているゲームがありません。');
                return;
            }
            if (session.userList.length >= MAX_USER_COUNT) {
                notificationReply(interaction, '参加人数が上限に達しました。');
                return;
            }
            if (session.userList.filter(user => user.id === interaction.user.id).length) {
                notificationReply(interaction, '既に参加済みです。');
                return;
            }

            session.userList.push(new User(interaction.user.id));
            interaction.message.delete();

            const i = Math.round(Math.random());
            const [playFirst, drawFirst] = [
                await interaction.guild?.members.fetch(session.userList[i].id),
                await interaction.guild?.members.fetch(session.userList[i ^ 1].id)
            ];

            await interaction.reply({
                content: `先攻: ${playFirst?.toString()}\n後攻: ${drawFirst?.toString()}`,
                files: [
                    new AttachmentBuilder('./img/selecthand.png').setName('selecthand.png')
                ],
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xed04eb)
                        .setTitle('～番号決めフェーズ～')
                        .setDescription('0~9 の数字を用いて、同じ数字が含まれない３桁の番号を作ってください。')
                        .setImage('attachment://selecthand.png')
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('selectModal').setLabel('番号を決める').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setLabel('詳細ルール').setURL('https://ja.wikipedia.org/wiki/Numer0n#ルール').setStyle(ButtonStyle.Link)
                    )
                ],
            });
        }
    },
    selectModal: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction) => {
            const modal = new ModalBuilder()
                .setCustomId('select')
                .setTitle('番号を入力')
                .addComponents(new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(new TextInputBuilder()
                        .setCustomId('select')
                        .setLabel('同じ数字が含まれない３桁の番号を決めてください。')
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(3)
                        .setMaxLength(3)
                        .setPlaceholder('XXX')
                        .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        }
    },
    select: {
        description: '',
        options: [],
        execute: async (interaction: ModalSubmitInteraction, session) => {
            const num: string = interaction.fields.getTextInputValue('select');
            if (isNaN(Number(num))) {
                notificationReply(interaction, '３桁の番号を入力してください。');
                return;
            }
            if (num.split('').some(n => (num.match(new RegExp(n, 'g'))?.length || 0) > 1)) {
                notificationReply(interaction, '同じ数字を含まないでください。');
                return;
            }

            interaction.reply({ content: 'ok', ephemeral: true });
        }
    }
}