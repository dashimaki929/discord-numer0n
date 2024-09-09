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
    ModalSubmitInteraction,
} from 'discord.js';

import { Commands } from './typedef';
import { Session } from './class/Session';
import { History } from './class/History';
import { MAX_USER_COUNT, TURN_COLOR, NUMBER_ICON } from './common/constants';
import { deleteSessionMessageFromKey, judgeNumber, notificationReply, toHalfWidthDigit } from './common/util';

export const commands: Commands = {
    debug: {
        description: '🔧 デバッグ',
        options: [],
        execute: async (interaction: CommandInteraction, session: Session) => {
            if (interaction.user.id !== session.hostId) {
                await notificationReply(interaction, 'このコマンドを実行する権限がありません。');
                return;
            }
            await interaction.reply(`\`\`\`json\n${JSON.stringify(session, null, '\t')}\n\`\`\``);
        }
    },
    host: {
        description: '🟢 ゲームをホスト',
        options: [],
        execute: async (interaction: CommandInteraction) => {
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
                        new ButtonBuilder().setCustomId('join').setLabel('ゲームに参加').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setLabel('詳細ルール').setURL('https://ja.wikipedia.org/wiki/Numer0n#ルール').setStyle(ButtonStyle.Link)
                    )
                ],
            });
        }
    },
    join: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction, session: Session) => {
            if (session.playerMap.size >= MAX_USER_COUNT) {
                await notificationReply(interaction, '参加人数が上限に達しました。');
                return;
            }
            if (session.playerMap.has(interaction.user.id)) {
                await notificationReply(interaction, '既に参加済みです。');
                return;
            }

            session.playerMap.set(interaction.user.id, '');
            interaction.message.delete();

            const [playFirst, drawFirst] = [
                await interaction.guild?.members.fetch([...session.playerMap.keys()][session.turn]),
                await interaction.guild?.members.fetch([...session.playerMap.keys()][session.turn ^ 1])
            ];

            session.currentPlayer = playFirst?.user;

            const channel = await interaction.guild?.channels.fetch(interaction.channelId ?? '');
            if (channel?.isTextBased()) {
                channel.send({
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

            await interaction.deferUpdate();
        }
    },
    selectModal: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction) => {
            await interaction.showModal(new ModalBuilder()
                .setCustomId('select')
                .setTitle('自分の番号を入力')
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
                ));
        }
    },
    select: {
        description: '',
        options: [],
        execute: async (interaction: ModalSubmitInteraction, session: Session) => {
            const selectNumber: string = toHalfWidthDigit(interaction.fields.getTextInputValue('select'));
            if (isNaN(Number(selectNumber)) || !/^\d{3}$/.test(selectNumber)) {
                await notificationReply(interaction, '３桁の番号を入力してください。');
                return;
            }
            if ([...selectNumber].some(n => (selectNumber.match(new RegExp(n, 'g'))?.length ?? 0) > 1)) {
                await notificationReply(interaction, '同じ数字を含まないでください。');
                return;
            }

            session.playerMap.set(interaction.user.id, selectNumber);
            if ([...session.playerMap.values()].every(hand => Boolean(hand))) {
                interaction.message?.delete();

                const channel = await interaction.guild?.channels.fetch(interaction.channelId ?? '');
                if (channel?.isTextBased()) {
                    channel.send({
                        files: [
                            new AttachmentBuilder('./img/call.png').setName('call.png')
                        ],
                        embeds: [
                            new EmbedBuilder()
                                .setColor(TURN_COLOR[session.turn])
                                .setAuthor({ name: `${session.currentPlayer?.displayName} のターン`, iconURL: session.currentPlayer?.displayAvatarURL() })
                                .setTitle('～コールフェーズ～')
                                .setDescription('相手の数字を予想して３桁の番号をコールしてください。')
                                .setImage('attachment://call.png')
                        ],
                        components: [
                            new ActionRowBuilder<ButtonBuilder>().addComponents(
                                new ButtonBuilder().setCustomId('callModal').setLabel('コール').setStyle(ButtonStyle.Success),
                                new ButtonBuilder().setCustomId('history').setLabel('履歴').setStyle(ButtonStyle.Secondary).setDisabled(true),
                                new ButtonBuilder().setLabel('詳細ルール').setURL('https://ja.wikipedia.org/wiki/Numer0n#ルール').setStyle(ButtonStyle.Link)
                            )
                        ],
                    });
                }
            }

            await interaction.reply({
                content: `あなたの番号： ${[...selectNumber].map(n => NUMBER_ICON[Number(n)]).join(' ')}`,
                ephemeral: true,
            });
        }
    },
    callModal: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction, session: Session) => {
            if (interaction.user.id !== session.currentPlayer?.id) {
                await notificationReply(interaction, 'あなたのターンではありません。');
                return;
            }

            await interaction.showModal(new ModalBuilder()
                .setCustomId('call')
                .setTitle('相手の番号を予想')
                .addComponents(new ActionRowBuilder<TextInputBuilder>()
                    .addComponents(new TextInputBuilder()
                        .setCustomId('call')
                        .setLabel('３桁の番号を予想してください。')
                        .setStyle(TextInputStyle.Short)
                        .setMinLength(3)
                        .setMaxLength(3)
                        .setPlaceholder('XXX')
                        .setRequired(true)
                    )
                ));
        }
    },
    call: {
        description: '',
        options: [],
        execute: async (interaction: ModalSubmitInteraction, session: Session) => {
            if (interaction.user.id !== session.currentPlayer?.id) {
                await notificationReply(interaction, 'あなたのターンではありません。');
                return;
            }

            const guessNumber: string = toHalfWidthDigit(interaction.fields.getTextInputValue('call'));
            if (isNaN(Number(guessNumber)) || !/^\d{3}$/.test(guessNumber)) {
                await notificationReply(interaction, '３桁の番号を入力してください。');
                return;
            }

            session.turn ^= 1;
            await interaction.guild?.members.fetch([...session.playerMap.keys()][session.turn]).then(member => {
                session.currentPlayer = member.user;
            });

            interaction.message?.edit({
                embeds: [
                    new EmbedBuilder()
                        .setColor(TURN_COLOR[session.turn])
                        .setAuthor({ name: `${session.currentPlayer?.displayName} のターン`, iconURL: session.currentPlayer?.displayAvatarURL() })
                        .setTitle('～コールフェーズ～')
                        .setDescription('相手の数字を予想して３桁の番号をコールしてください。')
                        .setImage('attachment://call.png')
                ],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('callModal').setLabel('コール').setStyle(ButtonStyle.Success),
                        new ButtonBuilder().setCustomId('history').setLabel('履歴').setStyle(ButtonStyle.Secondary).setDisabled(false),
                        new ButtonBuilder().setLabel('詳細ルール').setURL('https://ja.wikipedia.org/wiki/Numer0n#ルール').setStyle(ButtonStyle.Link)
                    )
                ],
            });

            const targetHand = session.playerMap.get(session.currentPlayer?.id)!;
            const result: History = judgeNumber(guessNumber, targetHand);
            
            const histories = session.history.get(interaction.user.id) ?? new Array<History>();
            histories.push(result);
            session.history.set(interaction.user.id, histories);

            await deleteSessionMessageFromKey(session, 'call');

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xf0b132)
                        .setAuthor({ name: `${interaction.user.displayName} の予想`, iconURL: interaction.user.displayAvatarURL() })
                        .setTitle([...guessNumber].map(n => NUMBER_ICON[Number(n)]).join(' '))
                        .setDescription(`**${result.eat}EAT ， ${result.bite}BITE**`)
                ],
            }).then(msg => session.messages.set('call', msg));
        }
    },
    history: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction, session: Session) => {
            if (!session.playerMap.has(interaction.user.id)) {
                await notificationReply(interaction, 'ゲームに参加していません。');
                return;
            }

            const histories = session.history.get(interaction.user.id);
            if (!histories || !histories.length) {
                await notificationReply(interaction, '履歴が存在しません。');
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(0x4f545c)
                .setAuthor({ name: `${interaction.user.displayName} の履歴`, iconURL: interaction.user.displayAvatarURL() });
            
            histories.forEach((history, i) => embed.addFields({
                name: `${i+1}回目`,
                value: history.toString(),
            }));
            
            await deleteSessionMessageFromKey(session, `history-${interaction.user.id}`);

            await interaction.reply({
                embeds: [embed],
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('closeHistory').setLabel('閉じる').setStyle(ButtonStyle.Danger)
                    )
                ],
                ephemeral: true,
            }).then(msg => session.messages.set(`history-${interaction.user.id}`, msg));
        },
    },
    closeHistory: {
        description: '',
        options: [],
        execute: async (interaction: ButtonInteraction, session: Session) => {
            await deleteSessionMessageFromKey(session, `history-${interaction.user.id}`);
        }
    }
}