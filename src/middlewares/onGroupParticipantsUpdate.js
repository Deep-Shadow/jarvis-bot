/**
 * Evento chamado quando um usuário
 * entra ou sai de um grupo de WhatsApp.
 *
 * Esta função combina a lógica de boas-vindas/despedida do Jarvis.
 *
 * @author MRX@DEV
 */
const fs = require("node:fs");
const { errorLog, warningLog, infoLog } = require("../utils/logger");
const { getProfileImageData } = require("../services/baileys");
const { onlyNumbers, getRandomNumber } = require("../utils");
const {
    isActiveWelcomeGroup,
    isActiveExitGroup,
    isActiveGroup
} = require("../utils/database");
const {
    welcomeMessage,
    exitMessage
} = require("../../database/reception-message");
const {
    spiderAPITokenConfigured,
    exit: spiderExit,
    welcome: spiderWelcome
} = require("../services/spider-x-api");
const { upload } = require("../services/upload");

exports.onGroupParticipantsUpdate = async (data, socket) => {
    try {
        const { id: remoteJid, participants, action, timestamp } = data;
        const userJid = participants[0];

        const eventTime = new Date(timestamp * 1000);
        const now = new Date();
        const diffMinutes = (now - eventTime) / (1000 * 60);

        if (diffMinutes > 5) {
            infoLog(
                `Evento antigo ignorado (${diffMinutes.toFixed(
                    1
                )} minutos atrás)`
            );
            return;
        }

        if (!remoteJid.endsWith("@g.us")) {
            return;
        }

        if (!isActiveGroup(remoteJid)) {
            infoLog(
                `Grupo ${remoteJid} não está ativo. Ignorando evento.`
            );
            return;
        }

        if (action === "add" && isActiveWelcomeGroup(remoteJid)) {
            const { buffer, profileImage } = await getProfileImageData(
                socket,
                userJid
            );

            const hasMemberMention = welcomeMessage.includes("@member");
            const mentions = [];
            let finalWelcomeMessage = welcomeMessage;

            if (hasMemberMention) {
                finalWelcomeMessage = welcomeMessage.replace(
                    "@member",
                    `@${onlyNumbers(userJid)}`
                );
                mentions.push(userJid);
            }

            if (spiderAPITokenConfigured) {
                try {
                    const fileName = `${getRandomNumber(10_000, 99_9999)}.png`;
                    const link = await upload(buffer, fileName);

                    if (!link) {
                        throw new Error(
                            "Não consegui fazer o upload da imagem para a Spider-X-API."
                        );
                    }

                    const imageUrl = spiderWelcome(
                        "participante",
                        "Você é o mais novo membro do grupo!",
                        link
                    );

                    await socket.sendMessage(remoteJid, {
                        image: { url: imageUrl },
                        caption: finalWelcomeMessage,
                        mentions
                    });
                } catch (apiError) {
                    await socket.sendMessage(remoteJid, {
                        image: buffer,
                        caption: finalWelcomeMessage,
                        mentions
                    });
                }
            } else {
                await socket.sendMessage(remoteJid, {
                    image: buffer,
                    caption: finalWelcomeMessage,
                    mentions
                });
                warningLog(
                    `Token da Spider-API não configurada, enviando imagem de perfil padrão.`
                );
            }

            if (profileImage && !profileImage.includes("default-user")) {
                try {
                    fs.unlinkSync(profileImage);
                } catch (unlinkError) {
                    errorLog(
                        `Falha ao remover arquivo temporário ${profileImage}:`,
                        unlinkError
                    );
                }
            }
        } else if (action === "remove" && isActiveExitGroup(remoteJid)) {
            const { buffer, profileImage } = await getProfileImageData(
                socket,
                userJid
            );

            const hasMemberMention = exitMessage.includes("@member");
            const mentions = [];
            let finalExitMessage = exitMessage;

            if (hasMemberMention) {
                finalExitMessage = exitMessage.replace(
                    "@member",
                    `@${onlyNumbers(userJid)}`
                );
                mentions.push(userJid);
            }

            if (spiderAPITokenConfigured) {
                try {
                    const fileName = `${getRandomNumber(10_000, 99_9999)}.png`;
                    const link = await upload(buffer, fileName);

                    if (!link) {
                        throw new Error(
                            "Não consegui fazer o upload da imagem para a Spider-X-API."
                        );
                    }

                    const imageUrl = spiderExit(
                        "membro",
                        "Você foi um bom membro",
                        link
                    );

                    await socket.sendMessage(remoteJid, {
                        image: { url: imageUrl },
                        caption: finalMessage,
                        mentions
                    });
                } catch (apiError) {
                    await socket.sendMessage(remoteJid, {
                        image: buffer,
                        caption: finalExitMessage,
                        mentions
                    });
                }
            } else {
                await socket.sendMessage(remoteJid, {
                    image: buffer,
                    caption: finalExitMessage,
                    mentions
                });
                warningLog(
                    `Token da Spider-API não configurada, enviando imagem de perfil padrão.`
                );
            }

            if (profileImage && !profileImage.includes("default-user")) {
                try {
                    fs.unlinkSync(profileImage);
                } catch (unlinkError) {
                    errorLog(
                        `Falha ao remover arquivo temporário ${profileImage}:`,
                        unlinkError
                    );
                }
            }
        }
    } catch (mainError) {
        errorLog("Erro inesperado em onGroupParticipantsUpdate:", mainError);
    }
};
