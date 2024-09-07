import {
    EmbedBuilder,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} from 'discord.js';

import { Commands } from './typedef';
import { User } from './User';

const MAX_USER_COUNT = 2;

export const commands: Commands = {
    debug: {
        description: '🔧 デバッグ',
        options: [],
        execute: async (interaction, session) => {
            await interaction.reply(`\`\`\`json\n${JSON.stringify(session, null, '\t')}\n\`\`\``);
        }
    },
    ping: {
        description: '🔌 疎通確認',
        options: [],
        execute: async (interaction) => {
            await interaction.reply('Pong!');
        },
    },
    host: {
        description: '🟢 ゲームをホスト',
        options: [],
        execute: async (interaction, session) => {
            const userId = interaction.user.id;
            session.hostUserId = userId;
            session.userList.push(new User(userId));

            await interaction.reply({
                components: [
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        new ButtonBuilder().setCustomId('join').setLabel('ゲームに参加する').setStyle(ButtonStyle.Success)
                    )
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
                                'それぞれのプレイヤーが、0-9までの数字を用いて、3桁の番号を作成する。\n「084」のように上一桁が「0」の番号も作成可能性であるが、同じ数字を2つ以上用いた番号（例：「550」「377」）は作れない。',
                                '先攻のプレイヤーは相手の番号を推理してコールする。数字と桁が合っていた場合は「EAT」（イート）、数字は合っているが桁は合っていない場合は「BITE」（バイト）となる。',
                                'これを先攻・後攻が繰り返して行い、先に相手の番号を完全に当てきった（3桁戦なら3EATを相手に発表させた）プレイヤーの勝利となる。\n'
                            ].join('\n')
                        })
                        .addFields({ 
                            name: '🧰 アイテム',
                            value: '攻撃系アイテムと防御系アイテムがあり、同一ターンではそれぞれ1つずつのみ使用可能である。使用の際はアイテムボタンを押して使用するアイテムを宣言する。',
                            inline: true
                        })
                        .addFields({
                            name: '🌏 外部リンク',
                            value: [
                                '・[詳細ルール](https://ja.wikipedia.org/wiki/Numer0n#ルール)',
                                '・[アイテム一覧（Wiki）](https://ja.wikipedia.org/wiki/Numer0n#アイテム)',
                            ].join('\n'),
                            inline: true
                        })
                ],
                files: [
                    new AttachmentBuilder('./img/banner.png').setName('banner.png')
                ]
            });
        }
    }
}