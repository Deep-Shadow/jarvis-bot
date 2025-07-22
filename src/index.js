/**
 * Este script é responsável
 * pelas funções que
 * serão executadas
 * no Bot.
 *
 * Aqui é onde você
 * vai definir
 * o que o seu bot
 * vai fazer.
 *
 * @author MRX </>
 */

const { exec } = require("child_process");
const fs = require("node:fs");
const path = require("node:path");

const axios = require("axios");
const { consultarCep } = require("correios-brasil/dist");

const {
    ASSETS_DIR,
    BOT_EMOJI,
    BOT_NUMBER,
    BOT_NAME,
    DATABASE_DIR,
    DEVELOPER_MODE,
    ONLY_GROUP_ID,
    OWNER_NUMBER,
    TEMP_DIR
} = require("./config");
const {
    DangerError,
    InvalidParameterError,
    WarningError
} = require("./errors");
const Ffmpeg = require("./services/ffmpeg");
const { getProfileImageData } = require("./services/baileys");
const {
    addStickerMetadata,
    isAnimatedSticker,
    processAnimatedSticker,
    processStaticSticker
} = require("./services/sticker");
const {
    play,
    pinterest_search,
    tiktok
} = require("./services/dark-shadow-api");
const {
    attp,
    canvas,
    download,
    gemini,
    imageAI,
    search,
    ttp
} = require("./services/spider-x-api");
const { upload } = require("./services/upload");
const {
    activateAntiLinkGroup,
    activateAutoResponderGroup,
    activateAntiOwnerTag,
    activateGroup,
    addGroup,
    deactivateAntiLinkGroup,
    deactivateAntiOwnerTag,
    deactivateAutoResponderGroup,
    deactivateGroup,
    getAutoResponderResponse,
    isActiveAntiLinkGroup,
    isActiveAutoResponderGroup,
    isActiveAntiOwnerTagGroup,
    isActiveGroup,
    isActiveRoundGroup
} = require("./utils/database");
const { loadCommandFunctions } = require("./utils/functions");
const { errorLog, infoLog } = require("./utils/logger");
const { menu } = require("./utils/menu");
const {
    checkPrefix,
    isAdmin,
    isLink,
    isOwner,
    isBotOwner,
    delay,
    onlyNumbers,
    getRandomName,
    getRandomNumber,
    removeAccentsAndSpecialCharacters,
    toUserJid
} = require("./utils");

async function startBot({ socket, data, startProcess }) {
    const functions = loadCommandFunctions({ socket, data });
    const ffmpeg = new Ffmpeg();

    if (!functions) {
        return;
    }

    const {
        args,
        command,
        fullArgs,
        body,
        ban,
        isGroup,
        isGroupWithLid,
        isAudio,
        isImage,
        isReply,
        isSticker,
        isVideo,
        prefix,
        replyJid,
        userJid,
        webMessage,

        deleteMessage,
        downloadAudio,
        downloadImage,
        downloadSticker,
        downloadVideo,

        remoteJid,
        getGroupAdmins,
        getGroupMetadata,
        getGroupName,
        getGroupOwner,
        getGroupParticipants,

        sendAudioFromBuffer,
        sendAudioFromFile,
        sendAudioFromURL,
        sendDocumentFromBuffer,
        sendDocumentFromFile,
        sendDocumentFromURL,
        sendErrorReact,
        sendErrorReply,
        sendGifFromBuffer,
        sendGifFromFile,
        sendGifFromURL,
        sendImageFromBuffer,
        sendImageFromFile,
        sendImageFromURL,
        sendPoll,
        sendPaymentRequest,
        sendContact,
        sendReact,
        sendRecordState,
        sendReply,
        sendStickerFromBuffer,
        sendStickerFromFile,
        sendStickerFromURL,
        sendSuccessReact,
        sendSuccessReply,
        sendText,
        sendTypingState,
        sendVideoFromBuffer,
        sendVideoFromFile,
        sendVideoFromURL,
        sendWaitReact,
        sendWaitReply,
        sendWarningReact,
        sendWarningReply
    } = functions;

    if (
        !isActiveGroup(remoteJid) &&
        !(await isOwner(userJid, remoteJid, socket))
    ) {
        return;
    }

    if (ONLY_GROUP_ID && ONLY_GROUP_ID != remoteJid) {
        return;
    }

    if (
        isActiveAntiOwnerTagGroup(remoteJid) &&
        body.includes(OWNER_NUMBER) &&
        !userJid.includes(OWNER_NUMBER) &&
        !userJid.includes(BOT_NUMBER)
    ) {
        try {
            await ban(remoteJid, userJid);
            return await sendReply("Nunca mais marque meu dono!");
        } catch (error) {
            return await sendErrorReply(
                "Eu preciso ser administrador para remover membros!"
            );
        }
    }

    if (DEVELOPER_MODE && isActiveGroup(remoteJid)) {
        console.log(
            `\n\n<========== ( MESSAGE RECEBIDA ) ==========>\n\n${JSON.stringify(
                webMessage,
                null,
                2
            )}`
        );
    }

    if (!checkPrefix(prefix)) {
        if (isGroup && isActiveAutoResponderGroup(remoteJid)) {
            const response = getAutoResponderResponse(body);
            if (response) {
                await sendReply(response);
            }
        }

        if (
            isGroup &&
            isActiveAntiLinkGroup(remoteJid) &&
            isLink(body) &&
            !(await isAdmin(userJid, remoteJid, socket))
        ) {
            await ban(remoteJid, userJid);
            await sendReply(
                "Anti-link ativado! Você foi removido por enviar um link!"
            );
            return;
        }

        return;
    }

    // ⚠️ ATENÇÃO ⚠️
    /**
     Não coloque nada acima, as cases são definidas a baixo
     sempre crie cases privadas para evitar conflito entre constantes e funções
      
     exemplo:
         case "nome": {
           await sendReply("minha case");
           break;
         }
     */

    try {
        switch (command?.toLowerCase()) {
            case "ai":
            case "gemini":
            case "ia":
            case "jarvis": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa me dizer o que eu devo responder!"
                    );
                }
                await sendWaitReact();
                const responseText = await gemini(fullArgs.trim());
                await sendSuccessReply(responseText);
                break;
            }

            case "anti-link": {
                if (!isAdmin(userJid, remoteJid, socket)) {
                }

                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa digitar 1 ou 0 (ligar ou desligar)!"
                    );
                }
                const antiLinkOn = args[0] === "1";
                const antiLinkOff = args[0] === "0";
                if (!antiLinkOn && !antiLinkOff) {
                    throw new InvalidParameterError(
                        "Você precisa digitar 1 ou 0 (ligar ou desligar)!"
                    );
                }
                if (antiLinkOn) {
                    activateAntiLinkGroup(remoteJid);
                } else {
                    deactivateAntiLinkGroup(remoteJid);
                }
                await sendSuccessReact();
                const antiLinkContext = antiLinkOn ? "ativado" : "desativado";
                await sendReply(
                    `Recurso de anti-link ${antiLinkContext} com sucesso!`
                );
                break;
            }

            case "anti-owner-tag":
            case "nao-marcar-dono": {
                if (!isBotOwner(userJid, remoteJid, socket)) {
                    throw new DangerError(
                        "Você não tem permissão para executar este comando!"
                    );
                }

                if (!args.length) {
                    throw new InvalidParameterError(
                        "Use 1 ou 0 para ativar ou desativar o recurso de anti-marcação!"
                    );
                }

                const antiTagOn = args[0] == "1";
                const antiTagOff = args[0] == "0";

                if (antiTagOn) {
                    activateAntiOwnerTag(remoteJid);
                } else if (antiTagOff) {
                    deactivateAntiOwnerTag(remoteJid);
                }

                await sendSuccessReply(
                    "Marcações ao meu dono não seram mais permitidas nesse grupo!"
                );
                break;
            }

            case "attp": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa informar o texto que deseja transformar em figurinha."
                    );
                }
                await sendWaitReact();
                const attpUrl = await attp(fullArgs.trim());
                await sendSuccessReact();
                await sendStickerFromURL(attpUrl);
                break;
            }

            case "abrir":
            case "abrir-grupo":
            case "abrir-gp": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    throw new DangerError(
                        "Você não tem permissão para executar este comando!"
                    );
                }

                try {
                    await socket.groupSettingUpdate(
                        remoteJid,
                        "not_announcement"
                    );
                    await sendSuccessReply("Grupo aberto com sucesso!");
                } catch (error) {
                    await sendErrorReply(
                        "Para abrir o grupo, eu preciso ser administrador dele!"
                    );
                    errorLog("Ocorreu um erro ao abrir o grupo!", error);
                }
                break;
            }

            case "ban":
            case "banir":
            case "kick": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    throw new DangerError(
                        "Você não tem permissão para executar este comando!"
                    );
                }
                if (!args.length && !isReply) {
                    throw new InvalidParameterError(
                        "Você precisa mencionar ou marcar um membro!"
                    );
                }
                const memberToRemoveJid = isReply
                    ? replyJid
                    : toUserJid(args[0]);
                const memberToRemoveNumber = onlyNumbers(memberToRemoveJid);
                if (
                    memberToRemoveNumber.length < 7 ||
                    memberToRemoveNumber.length > 15
                ) {
                    throw new InvalidParameterError("Número inválido!");
                }
                if (memberToRemoveJid === userJid) {
                    throw new DangerError("Você não pode remover você mesmo!");
                }
                const botJid = toUserJid(BOT_NUMBER);
                if (memberToRemoveJid === botJid) {
                    throw new DangerError("Você não pode me remover!");
                }
                await ban(remoteJid, memberToRemoveJid);
                await sendSuccessReply("Membro removido com sucesso!");
                break;
            }

            case "blur":
            case "embaca":
            case "embacar": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }
                await sendWaitReact();
                const filePath = await downloadImage(webMessage);
                try {
                    const outputPath = await ffmpeg.applyBlur(filePath);
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                } catch (error) {
                    console.error(error);
                    throw new Error("Erro ao aplicar efeito de blur");
                } finally {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
                break;
            }

            case "bolsonaro": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();

                const fileName = getRandomNumber(10_000, 99_999).toString();

                const filePath = await downloadImage(webMessage, fileName);

                const buffer = fs.readFileSync(filePath);
                const link = await upload(buffer, `${fileName}.png`);

                if (!link) {
                    throw new DangerError(
                        "Não consegui fazer o upload da imagem, tente novamente mais tarde!"
                    );
                }

                const url = canvas("bolsonaro", link);

                await sendSuccessReact();

                await sendImageFromURL(url, "Imagem gerada!");

                fs.unlinkSync(filePath);
                break;
            }

            case "cep": {
                const cep = args[0];
                if (!cep || ![8, 9].includes(cep.length)) {
                    throw new InvalidParameterError(
                        "Você precisa enviar um CEP no formato 00000-000 ou 00000000!"
                    );
                }
                const data = await consultarCep(cep);
                if (!data.cep) {
                    await sendWarningReply("CEP não encontrado!");
                    return;
                }
                await sendSuccessReply(`*Resultado*
*CEP*: ${data.cep}
*Logradouro*: ${data.logradouro}
*Complemento*: ${data.complemento}
*Bairro*: ${data.bairro}
*Localidade*: ${data.localidade}
*UF*: ${data.uf}
*IBGE*: ${data.ibge}`);
                break;
            }

            case "contraste":
            case "melhorar": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();

                const filePath = await downloadImage(webMessage);

                try {
                    const outputPath = await ffmpeg.adjustContrast(filePath);
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                } catch (error) {
                    console.error(error);
                    throw new Error("Erro ao aplicar efeito de contraste");
                } finally {
                    await ffmpeg.cleanup(filePath);
                }
                break;
            }

            case "cadeia":
            case "jaula":
            case "jail": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();

                const fileName = getRandomNumber(10_000, 99_999).toString();
                const filePath = await downloadImage(webMessage, fileName);

                const buffer = fs.readFileSync(filePath);
                const link = await upload(buffer, `${fileName}.png`);

                if (!link) {
                    throw new DangerError(
                        "Não consegui fazer o upload da imagem, tente novamente mais tarde!"
                    );
                }

                const url = canvas("jail", link);

                await sendSuccessReact();

                await sendImageFromURL(url, "Imagem gerada!");

                fs.unlinkSync(filePath);
                break;
            }

            case "dado":
            case "dados":
            case "rolar-dado":
            case "rolar-dados": {
                const number = parseInt(args[0]);
                if (isNaN(number) || number < 1 || number > 6) {
                    throw new InvalidParameterError(
                        `Por favor, escolha um número entre 1 e 6!\nExemplo: ${prefix}dado 3`
                    );
                }
                await sendWaitReply("🎲 Rolando o dado...");
                const result = getRandomNumber(1, 6);
                const pushName = webMessage?.pushName || "Usuário";
                const stickerPath = path.resolve(
                    ASSETS_DIR,
                    "stickers",
                    "dice",
                    `${result}.webp`
                );
                if (fs.existsSync(stickerPath)) {
                    await sendStickerFromFile(stickerPath);
                } else {
                    await sendReply(`O dado caiu em *${result}*!`);
                }
                await delay(2000);
                if (number === result) {
                    await sendReact("🏆");
                    await sendReply(
                        `🎉 *${pushName} GANHOU!* Você apostou número *${number}* e o dado caiu em *${result}*! 🍀`
                    );
                } else {
                    await sendReact("😭");
                    await sendReply(
                        `💥 *${pushName} PERDEU...* Você apostou no *${number}* mas o dado caiu em *${result}*! Tente novamente.`
                    );
                }
                break;
            }

            case "delete":
            case "apagar":
            case "d": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não permissão para usar esse comando!"
                    );
                }

                const { stanzaId, participant } =
                    webMessage?.message?.extendedTextMessage?.contextInfo;

                if (!stanzaId || !participant) {
                    throw new InvalidParameterError(
                        "Você deve mencionar uma mensagem para excluir!"
                    );
                }

                await deleteMessage({
                    remoteJid,
                    fromMe: false,
                    id: stanzaId,
                    participant
                });

                break;
            }

            case "dono":
            case "criador": {
                await sendWaitReply("Processando seu pedido...");
                await delay(2000);
                await sendContact("MRX ( DEV )", OWNER_NUMBER);
                return await sendSuccessReact();
                break;
            }

            case "enquete":
            case "poll": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                if (!fullArgs || fullArgs.length < 3) {
                    throw new InvalidParameterError(
                        `\n\n- Use: ${prefix}enquete Título da enquete/Opção 1/Opção 2/Opção 3`
                    );
                }
                await sendWaitReact();
                const [title, ...options] = fullArgs
                    .split("/")
                    .map(item => item.trim());
                if (options.length < 2)
                    throw new InvalidParameterError(
                        "São necessárias pelo menos 2 opções!"
                    );
                if (options.length > 10)
                    throw new InvalidParameterError(
                        "Máximo de 10 opções permitidas!"
                    );
                const pollOptions = options
                    .filter(opt => opt)
                    .map((opt, index) => ({
                        optionName: opt || `Opção ${index + 1}`
                    }));
                await delay(2000);
                await sendPoll(title, pollOptions, true);
                await sendSuccessReact();
                break;
            }

            case "espelhar": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }
                await sendWaitReact();
                const filePath = await downloadImage(webMessage);
                try {
                    const outputPath = await ffmpeg.mirrorImage(filePath);
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                } catch (error) {
                    console.error(error);
                    throw new Error("Erro ao aplicar efeito de espelhamento");
                } finally {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
                break;
            }

            case "exec":
            case "execute":
            case "executar": {
                if (!(await isBotOwner(userJid, remoteJid, socket))) {
                    throw new DangerError(
                        "Apenas o dono do bot pode usar este comando!"
                    );
                }

                if (!fullArgs) {
                    throw new DangerError(`Uso correto: ${prefix}exec comando`);
                }

                exec(fullArgs, (error, stdout) => {
                    if (error) {
                        return sendErrorReply(
                            `Erro ao executar: ${error.message}`
                        );
                    }

                    const output = stdout || "Comando executado sem saída.";

                    return sendSuccessReply(
                        `Resultado:\n\`\`\`\n${output
                            .trim()
                            .slice(0, 4000)}\n\`\`\``
                    );
                });
                break;
            }

            case "fechar":
            case "fechar-grupo":
            case "fechar-gp": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                try {
                    await socket.groupSettingUpdate(remoteJid, "announcement");
                    await sendSuccessReply("Grupo fechado com sucesso!");
                } catch (error) {
                    await sendErrorReply(
                        "Para fechar o grupo, eu preciso ser administrador dele!"
                    );
                    errorLog("Ocorreu um erro ao fechar o grupo! ", error);
                }
                break;
            }

            case "fake-chat":
            case "fake-quoted":
            case "mensagem-fake":
            case "msg-fake": {
                if (args.length !== 3) {
                    throw new InvalidParameterError(
                        `\n\n- Use: ${prefix}fakechat @usuário / texto citado / mensagem que será enviada`
                    );
                }
                const quoted_text = args[1];
                const response_text = args[2];
                const mentionedJid = toUserJid(args[0]);

                if (quoted_text.length < 2) {
                    throw new InvalidParameterError(
                        "O texto citado deve ter pelo menos 2 caracteres."
                    );
                }
                if (response_text.length < 2) {
                    throw new InvalidParameterError(
                        "A mensagem de resposta deve ter pelo menos 2 caracteres."
                    );
                }

                const fakeQuoted = {
                    key: {
                        fromMe: false,
                        participant: mentionedJid,
                        remoteJid
                    },
                    message: {
                        extendedTextMessage: {
                            text: quoted_text,
                            contextInfo: {
                                mentionedJid: [mentionedJid]
                            }
                        }
                    }
                };
                await socket.sendMessage(
                    remoteJid,
                    { text: response_text },
                    { quoted: fakeQuoted }
                );
                break;
            }

            case "get-jid":
            case "get-lid":
            case "user-lid": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você deve mencionar alguém ou informar um contato!"
                    );
                }
                const [result] = await socket.onWhatsApp(onlyNumbers(args[0]));
                if (!result) {
                    throw new WarningError(
                        "O número informado não está registrado no WhatsApp!"
                    );
                }
                const jid = result?.jid;
                const lid = result?.lid;
                await sendSuccessReply(
                    `\n\n- JID: ${jid}${lid ? `\n- LID: ${lid}` : ""}`
                );
                break;
            }

            case "get-id":
            case "grupo-id": {
                if (!isGroup) {
                    throw new WarningError(
                        "Este comando deve ser usado dentro de um grupo."
                    );
                }

                await sendSuccessReply(`*ID do grupo*: ${remoteJid}`);
                break;
            }

            case "google-search":
            case "google":
            case "pesquisar": {
                if (fullArgs.length <= 1) {
                    throw new InvalidParameterError(
                        "Você precisa fornecer uma pesquisa para o Google."
                    );
                }

                const maxLength = 100;

                if (fullArgs.length > maxLength) {
                    throw new InvalidParameterError(
                        `O tamanho máximo da pesquisa é de ${maxLength} caracteres.`
                    );
                }

                const data = await search("google", fullArgs);

                if (!data) {
                    throw new WarningError(
                        "Não foi possível encontrar resultados para a pesquisa."
                    );
                }

                let text = "";

                for (const item of data) {
                    text += `Título: *${item.title}*\n\n`;
                    text += `Descrição: ${item.description}\n\n`;
                    text += `URL: ${item.url}\n\n-----\n\n`;
                }

                text = text.slice(0, -2);

                await sendSuccessReply(`*Pesquisa realizada*

*Termo*: ${fullArgs}

*Resultados*
${text}`);
                break;
            }

            case "gray":
            case "cinza": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();
                const filePath = await downloadImage(webMessage);
                const ffmpeg = new Ffmpeg();

                try {
                    const outputPath =
                        await ffmpeg.convertToGrayscale(filePath);
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                } catch (error) {
                    console.error(error);
                    throw new Error("Erro ao aplicar efeito preto e branco");
                } finally {
                    await ffmpeg.cleanup(filePath);
                }
                break;
            }

            case "hidetag":
            case "marcar":
            case "tag-all": {
                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                const { participants } = await socket.groupMetadata(remoteJid);
                const mentions = participants.map(({ id }) => id);
                await sendReact("📢");
                await sendText(`📢 Marcando todos!\n\n${fullArgs}`, mentions);
                break;
            }

            case "image-menu":
            case "img-menu":
            case "set-image-menu": {
                if (!(await isBotOwner(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                if (!isReply && !isImage) {
                    throw new InvalidParameterError(
                        "Você precisa responder a uma mensagem que contenha uma imagem!"
                    );
                }

                const menuImagePath = path.join(
                    ASSETS_DIR,
                    "images",
                    "menu.png"
                );
                let backupPath = "";
                if (fs.existsSync(menuImagePath)) {
                    backupPath = path.join(
                        ASSETS_DIR,
                        "images",
                        "menu-backup.png"
                    );
                    fs.copyFileSync(menuImagePath, backupPath);
                }
                const tempPath = await downloadImage(
                    webMessage,
                    "new-menu-image-temp"
                );
                if (fs.existsSync(menuImagePath)) {
                    fs.unlinkSync(menuImagePath);
                }
                fs.renameSync(tempPath, menuImagePath);
                await sendSuccessReply("Imagem do menu atulizada com sucesso!");
                break;
            }

            case "inverter":
            case "inverte":
            case "invert": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();

                const fileName = getRandomNumber(10_000, 99_999).toString();
                const filePath = await downloadImage(webMessage, fileName);

                const buffer = fs.readFileSync(filePath);
                const link = await upload(buffer, `${fileName}.png`);

                if (!link) {
                    throw new Error(
                        "Não consegui fazer o upload da imagem, tente novamente mais tarde!"
                    );
                }

                const url = canvas("invert", link);

                await sendSuccessReact();

                await sendImageFromURL(url, "Imagem gerada!");

                fs.unlinkSync(filePath);
                break;
            }

            case "ia-sticker":
            case "sticker-ia":
            case "ia-fig":
            case "fig-ia": {
                if (!args[0]) {
                    return sendWarningReply(
                        "Você precisa fornecer uma descrição para a imagem."
                    );
                }

                await sendWaitReply("gerando figurinha...");

                const data = await imageAI("pixart", fullArgs);

                if (data.image) {
                    await sendStickerFromURL(data.image);
                    await sendSuccessReact();
                } else {
                    await sendWarningReply(
                        "Não foi possível gerar a figurinha. Tente novamente mais tarde."
                    );
                }
                break;
            }

            case "limpar":
            case "limpar-chat":
            case "clear":
            case "clean": {
                if (!isGroup) {
                    throw new WarningError(
                        "Esse comando só pode ser usado em grupos."
                    );
                }

                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                await sendSuccessReact();

                await delay(1000);

                const cleanMessage = {
                    botInvokeMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadataVersion: 2,
                                deviceListMetadata: {}
                            },
                            imageMessage: {
                                url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f1/m234/up-oil-image-e1bbfe2b-334b-4c5d-b716-d80edff29301?ccb=9-4&oh=01_Q5AaID0uZoxsi9v2I7KJZEgeJ7IVkFPZkt2yeYf6ps0IWG2g&oe=66E7130B&_nc_sid=000000&mms3=true",
                                mimetype: "image/png",
                                caption: `${BOT_EMOJI} Limpo ✅️`,
                                fileSha256:
                                    "YVuPx9PoIxL0Oc3xsUc3n3uhttmVYlqUV97LKKvIjL8=",
                                fileLength: "999999999",
                                height: 10000000000000000,
                                width: 99999999999999999999999,
                                mediaKey:
                                    "4T8WJKuKvJ9FXSwldCXe5+/IA7aYi5ycf301J0xIZwA=",
                                fileEncSha256:
                                    "jfG3tesFLdqtCzO6cqU51HGGkEtd7+w22aJtaEm2yjE=",
                                directPath:
                                    "/v/t62.7118-24/29631950_1467571294644184_4827066390759523804_n.enc?ccb=11-4&oh=01_Q5AaIFPK_QoDRMR4vZIBbMTdy6GreGhSA2HHRAIu0-vAMgqN&oe=66E72F5E&_nc_sid=5e03e0",
                                mediaKeyTimestamp: "1723839207",
                                jpegThumbnail: "imagenMiniaturaBase64",
                                scansSidecar:
                                    "il8IxPgrhGdtn37jGMVgQVRKlPd/CERE+Nr822DZe2UT9r0YT3KPSQ==",
                                scanLengths: [5373, 24562, 15656, 22918],
                                midQualityFileSha256:
                                    "s8Li+/zg2VmzMvJtRAZHPVres8nAPEWcd11nK5b/keY="
                            }
                        },
                        expiration: 0,
                        ephemeralSettingTimestamp: "1723838053",
                        disappearingMode: {
                            initiator: "CHANGED_IN_CHAT",
                            trigger: "UNKNOWN",
                            initiatedByMe: true
                        }
                    }
                };

                await socket.relayMessage(remoteJid, cleanMessage, {});
                break;
            }

            case "menu": {
                await sendSuccessReact();
                await sendImageFromFile(
                    path.join(ASSETS_DIR, "images", "menu.png"),
                    `\n\n${menu()}`
                );
                break;
            }

            case "off": {
                if (!(await isOwner(userJid, remoteJid, socket))) {
                    throw new DangerError(
                        "Você não tem permissão para executar este comando!"
                    );
                }
                deactivateGroup(remoteJid);
                await sendSuccessReply("Bot desativado no grupo!");
                break;
            }

            case "on": {
                if (!(await isOwner(userJid, remoteJid, socket))) {
                    throw new DangerError(
                        "Você não tem permissão para executar este comando!"
                    );
                }
                activateGroup(remoteJid);
                await sendSuccessReply("Bot ativado no grupo!");
                break;
            }

            case "pix":
            case "pagamento": {
                await sendPaymentRequest(remoteJid, "1000", "BRL");
                break;
            }

            case "perfil":
            case "profile": {
                if (!isGroup) {
                    throw new InvalidParameterError(
                        "Este comando só deve ser usado em grupo."
                    );
                }

                const targetJid = args[0]
                    ? args[0].replace(/[@ ]/g, "") + "@s.whatsapp.net"
                    : userJid;

                await sendWaitReply("Carregando perfil...");

                let profilePicBuffer = null;
                let profilePicFallbackUrl = null;
                let userName = "Usuário Desconhecido";
                let userRole = "Membro";
                const mentions = [targetJid];

                try {
                    const { buffer, profileImage } = await getProfileImageData(
                        targetJid,
                        socket
                    );
                    if (buffer) {
                        profilePicBuffer = buffer;
                    } else if (profileImage) {
                        profilePicFallbackUrl = profileImage;
                    } else {
                        profilePicFallbackUrl = path.join(
                            ASSETS_DIR,
                            "images",
                            "default-user.png"
                        );
                    }

                    const contactInfo = await socket.onWhatsApp(targetJid);
                    if (contactInfo && contactInfo[0]?.name) {
                        userName = contactInfo[0].name;
                    } else if (contactInfo && contactInfo[0]?.verifiedName) {
                        userName = contactInfo[0].verifiedName;
                    } else {
                        userName = targetJid.split("@")[0];
                    }
                } catch (error) {
                    errorLog(
                        `Erro ao tentar pegar dados de perfil/contato para ${targetJid}: ${error.message}`
                    );
                    profilePicFallbackUrl = path.join(
                        ASSETS_DIR,
                        "images",
                        "default-user.png"
                    );
                }

                const groupMetadata = await getGroupMetadata();
                const participant = groupMetadata.participants.find(
                    p => p.id === targetJid
                );
                if (participant?.admin) {
                    userRole = "Administrador";
                }

                const randomPercent = Math.floor(Math.random() * 100);
                const programPrice = (Math.random() * 5000 + 1000).toFixed(2);
                const beautyLevel = Math.floor(Math.random() * 100) + 1;

                const mensagem = `
👤 *Nome:* @${targetJid.split("@")[0]}
🎖️ *Cargo:* ${userRole}

🌚 *Programa:* R$ ${programPrice}
🐮 *Gado:* ${randomPercent + 7 || 5}%
🎱 *Passiva:* ${randomPercent + 5 || 10}%
✨ *Beleza:* ${beautyLevel}%`;

                await sendSuccessReact();

                if (profilePicBuffer) {
                    return await sendImageFromBuffer(
                        profilePicBuffer,
                        mensagem,
                        mentions
                    );
                } else if (profilePicFallbackUrl) {
                    return await sendImageFromURL(
                        profilePicFallbackUrl,
                        mensagem,
                        mentions
                    );
                } else {
                    await sendReply(
                        "Não foi possível carregar a imagem de perfil, mas aqui estão as informações:\n" +
                            mensagem
                    );
                }
                break;
            }

            case "promover":
            case "dar-adm": {
                if (!isGroup) {
                    throw new WarningError(
                        "Este comando só pode ser usado em grupo !"
                    );
                }

                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                if (!args.length || !args[0]) {
                    return sendWarningReply(
                        "Por favor, marque um usuário para promover."
                    );
                }

                const userId = args[0].replace("@", "") + "@s.whatsapp.net";

                try {
                    await socket.groupParticipantsUpdate(
                        remoteJid,
                        [userId],
                        "promote"
                    );
                    await sendSuccessReply("Usuário promovido com sucesso!");
                } catch (error) {
                    errorLog(`Erro ao promover usuário: ${error.message}`);
                    await sendErrorReply(
                        "Ocorreu um erro ao tentar promover o usuário. Eu preciso ser administrador do grupo para promover outros usuários!"
                    );
                }

                break;
            }

            case "ping":
            case "pong": {
                const response = body.slice(1).startsWith("ping")
                    ? "🏓 Pong!"
                    : "🏓 Ping!";
                await sendReact("🏓");
                const uptime = process.uptime();
                const h = Math.floor(uptime / 3600);
                const m = Math.floor((uptime % 3600) / 60);
                const s = Math.floor(uptime % 60);
                const ping = Date.now() - startProcess;
                await sendReply(`${response}
                
⏱️ Online àh: ${h}h ${m}m ${s}s
⚡ Tempo de resposta: ${ping}ms`);
                break;
            }

            case "pin-search":
            case "pinterest-search": {
                if (!args) {
                    throw new InvalidParameterError(
                        "Informe oque devo buscar!"
                    );
                }

                await sendWaitReact();

                const pinData = await pinterest_search(args);
                if (!pinData) {
                    return await sendWarningReply(
                        "Nenhum resultado encontrado!"
                    );
                }

                await sendImageFromURL(pinData.urls);
                return sendSuccessReact();
                break;
            }

            case "pixel": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }
                await sendWaitReact();
                const filePath = await downloadImage(webMessage);
                try {
                    const outputPath = await ffmpeg.applyPixelation(filePath);
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                } catch (error) {
                    console.error(error);
                    throw new Error("Erro ao aplicar efeito pixel");
                } finally {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }
                break;
            }

            case "pixart": {
                if (!args[0]) {
                    return sendWarningReply(
                        "Você precisa fornecer uma descrição para a imagem."
                    );
                }

                await sendWaitReply("gerando imagem...");

                const data = await imageAI("pixart", fullArgs);

                if (!data?.image) {
                    return sendWarningReply(
                        "Não foi possível gerar a imagem! Tente novamente mais tarde."
                    );
                }

                await sendSuccessReact();
                await sendImageFromURL(data.image);
                break;
            }

            case "play":
            case "play-audio":
            case "play-yt": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa me dizer o que deseja buscar!"
                    );
                }
                await sendWaitReply("baixando sua música...");
                const playAudioData = await play("audio", fullArgs);
                if (!playAudioData) {
                    await sendErrorReply("Nenhum resultado encontrado!");
                    return;
                }
                await sendSuccessReact();
                await sendAudioFromURL(playAudioData.downloadLink.download);
                break;
            }

            case "play-video":
            case "play-vd":
            case "pv": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa me dizer o que deseja buscar!"
                    );
                }
                await sendWaitReply("baixando seu video...");
                const playVideoData = await play("video", fullArgs);
                if (!playVideoData) {
                    await sendErrorReply("Nenhum resultado encontrado!");
                    return;
                }
                await sendSuccessReact();
                await sendVideoFromURL(playVideoData.downloadLink.download);
                break;
            }

            case "get":
            case "raw": {
                if (!isReply) {
                    return await sendWarningReply(
                        "Responda a uma mensagem com este comando!"
                    );
                }

                await sendWaitReact();
                return await sendSuccessReply(
                    `\`\`\`json\n${JSON.stringify(webMessage, null, 2)}\n\`\`\``
                );
                break;
            }

            case "rename": {
                if (!isSticker) {
                    throw new InvalidParameterError(
                        "Você precisa responder a uma figurinha!"
                    );
                }
                const [pack, author] = fullArgs.split("/").map(s => s.trim());
                if (!pack || !author) {
                    throw new InvalidParameterError(
                        "Você precisa fornecer o pacote e o autor no formato: *pacote / autor*"
                    );
                }

                const minLength = 2;
                const maxLength = 50;

                if (pack.length < minLength || pack.length > maxLength) {
                    throw new DangerError(
                        `O nome do pacote deve ter entre ${minLength} e ${maxLength} caracteres.`
                    );
                }
                if (author.length < minLength || author.length > maxLength) {
                    throw new DangerError(
                        `O nome do autor deve ter entre ${minLength} e ${maxLength} caracteres.`
                    );
                }

                let finalStickerPath = null;
                await sendWaitReact();
                const input_path = await downloadSticker(
                    webMessage,
                    getRandomName("webp")
                );

                try {
                    const metadata = {
                        username: pack,
                        botName: author
                    };
                    const isAnimated = await isAnimatedSticker(input_path);

                    if (isAnimated) {
                        finalStickerPath = await processAnimatedSticker(
                            input_path,
                            metadata,
                            addStickerMetadata
                        );
                    } else {
                        finalStickerPath = await processStaticSticker(
                            input_path,
                            metadata,
                            addStickerMetadata
                        );
                    }
                    await sendSuccessReact();
                    await sendStickerFromFile(finalStickerPath);
                } catch (error) {
                    errorLog(`Erro ao renomear figurinha: ${error.message}`);
                    throw new Error(
                        `Erro ao renomear a figurinha: ${error.message}`
                    );
                } finally {
                    if (fs.existsSync(input_path)) {
                        fs.unlinkSync(input_path);
                    }
                    if (finalStickerPath && fs.existsSync(finalStickerPath)) {
                        fs.unlinkSync(finalStickerPath);
                    }
                }
                break;
            }

            case "rebaixar":
            case "tirar-adm": {
                if (!isGroup) {
                    throw new WarningError(
                        "Este comando só pode ser usado em grupo !"
                    );
                }

                if (!(await isAdmin(userJid, remoteJid, socket))) {
                    return await sendErrorReply(
                        "Você não tem permissão para usar este comando!"
                    );
                }

                if (!args.length || !args[0]) {
                    return sendWarningReply(
                        "Por favor, marque um administrador para rebaixar."
                    );
                }

                const userId = args[0].replace("@", "") + "@s.whatsapp.net";

                try {
                    await socket.groupParticipantsUpdate(
                        remoteJid,
                        [userId],
                        "demote"
                    );
                    await sendSuccessReply("Usuário rebaixado com sucesso!");
                } catch (error) {
                    errorLog(
                        `Erro ao rebaixar administrador: ${error.message}`
                    );
                    await sendErrorReply(
                        "Ocorreu um erro ao tentar rebaixar o usuário. Eu preciso ser administrador do grupo para rebaixar outros administradores!"
                    );
                }
                break;
            }

            case "revelar":
            case "x9-img": {
                if (!isImage && !isVideo) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem/vídeo ou responder a uma imagem/vídeo para revelá-la."
                    );
                }

                await sendWaitReact();

                const mediaCaption = `Aqui está ${
                    isImage ? "sua imagem revelada!" : "seu vídeo revelado!"
                }`;
                let inputPath;
                let outputPath;

                try {
                    if (isImage) {
                        inputPath = await downloadImage(
                            webMessage,
                            "input_image_reveal"
                        );
                        outputPath = path.resolve(
                            TEMP_DIR,
                            `${getRandomName()}.jpg`
                        );

                        await ffmpeg.revealImage(inputPath, outputPath);

                        await sendImageFromFile(outputPath, mediaCaption);
                        await sendSuccessReact();
                    } else if (isVideo) {
                        inputPath = await downloadVideo(
                            webMessage,
                            "input_video_reveal"
                        );
                        outputPath = path.resolve(
                            TEMP_DIR,
                            `${getRandomName()}.mp4`
                        );

                        await ffmpeg.revealVideo(inputPath, outputPath);

                        await sendVideoFromFile(outputPath, mediaCaption);
                        await sendSuccessReact();
                    }
                } catch (error) {
                    errorLog(
                        `Erro FFmpeg no comando revelar: ${error.message}`
                    );
                    throw new Error(
                        "Ocorreu um erro ao processar a mídia para revelação. Tente novamente."
                    );
                } finally {
                    await ffmpeg.cleanup(inputPath);
                    await ffmpeg.cleanup(outputPath);
                }
                break;
            }

            case "rip":
            case "morreu":
            case "lapide": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você precisa marcar uma imagem ou responder a uma imagem"
                    );
                }

                await sendWaitReact();

                const fileName = getRandomNumber(10_000, 99_999).toString();
                const filePath = await downloadImage(webMessage, fileName);

                const buffer = fs.readFileSync(filePath);
                const link = await upload(buffer, `${fileName}.png`);

                if (!link) {
                    throw new Error(
                        "Não consegui fazer o upload da imagem, tente novamente mais tarde!"
                    );
                }

                const url = canvas("rip", link);

                await sendSuccessReact();

                await sendImageFromURL(url, "Imagem gerada!");

                fs.unlinkSync(filePath);
                break;
            }

            case "s":
            case "sticker":
            case "f":
            case "fig":
            case "figu": {
                try {
                    if (!isImage && !isVideo && !isSticker) {
                        throw new InvalidParameterError(
                            "Você precisa marcar uma imagem/gif/vídeo ou responder a uma mídia para fazer uma figurinha."
                        );
                    }

                    await sendWaitReact();
                    let stickerPath;
                    const metadata = {
                        username:
                            webMessage.pushName ||
                            webMessage.notifyName ||
                            onlyNumbers(userJid),
                        botName: BOT_NAME,
                        categories: [""]
                    };

                    let mediaPath = null;

                    if (isImage) {
                        mediaPath = await downloadImage(
                            webMessage,
                            getRandomName("png")
                        );
                        stickerPath = await processStaticSticker(
                            mediaPath,
                            metadata
                        );
                    } else if (isVideo) {
                        mediaPath = await downloadVideo(
                            webMessage,
                            getRandomName("mp4")
                        );
                        const isAnimated = await isAnimatedSticker(mediaPath);

                        if (isAnimated) {
                            stickerPath = await processAnimatedSticker(
                                mediaPath,
                                metadata
                            );
                        } else {
                            stickerPath = await processStaticSticker(
                                mediaPath,
                                metadata
                            );
                        }
                    } else if (isSticker) {
                        const stickerBuffer = await downloadSticker(
                            webMessage,
                            getRandomName("webp")
                        );
                        stickerPath = await addStickerMetadata(
                            stickerBuffer,
                            metadata
                        );
                    }

                    await sendStickerFromFile(stickerPath);
                    await sendSuccessReact();

                    if (mediaPath && fs.existsSync(mediaPath)) {
                        fs.unlinkSync(mediaPath);
                    }
                    if (stickerPath && fs.existsSync(stickerPath)) {
                        fs.unlinkSync(stickerPath);
                    }
                } catch (error) {
                    await sendErrorReply(
                        `Erro ao criar figurinha: ${error.message}`
                    );
                    errorLog(`Erro no comando sticker: ${error.message}`);
                }
                break;
            }

            case "toimage":
            case "toimg": {
                if (!isSticker) {
                    throw new InvalidParameterError(
                        "Você precisa enviar uma figurinha!"
                    );
                }
                await sendWaitReact();
                const inputPath = await downloadSticker(
                    webMessage,
                    getRandomName("webp")
                );
                const outputPath = path.resolve(
                    TEMP_DIR,
                    `${getRandomNumber(10_000, 99_999)}.png`
                );

                exec(`ffmpeg -i ${inputPath} ${outputPath}`, async error => {
                    if (error) {
                        console.error("FFmpeg error:", error);
                        await sendErrorReply(
                            `Erro ao converter figurinha para imagem: ${error.message}`
                        );
                        return;
                    }
                    await sendSuccessReact();
                    await sendImageFromFile(outputPath);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                });
                break;
            }

            case "ttp": {
                if (!args.length) {
                    throw new InvalidParameterError(
                        "Você precisa informar o texto que deseja transformar em figurinha."
                    );
                }
                await sendWaitReact();
                const ttpUrl = await ttp(fullArgs.trim());
                await sendSuccessReact();
                await sendStickerFromURL(ttpUrl);
                break;
            }

            case "tiktok-search":
            case "ttk-search": {
                if (!fullArgs) {
                    throw new InvalidParameterError(
                        "Você precisa me dizer o que deseja buscar!"
                    );
                }
                await sendWaitReply("baixando seu video...");
                const playVideoData = await tiktok("search", fullArgs);
                if (!playVideoData) {
                    await sendErrorReply("Nenhum resultado encontrado!");
                    return;
                }
                await sendSuccessReact();
                await sendVideoFromURL(playVideoData.urls[0]);
                break;
            }

            case "tiktok":
            case "tiktok-audio":
            case "ttk": {
                if (!fullArgs) {
                    throw new InvalidParameterError(
                        "Você precisa informar o link da música!"
                    );
                }
                await sendWaitReply("baixando sua música...");
                const playVideoData = await tiktok("audio", fullArgs);
                if (!playVideoData) {
                    await sendErrorReply("Nenhum resultado encontrado!");
                    return;
                }
                await sendSuccessReact();
                await sendAudioFromURL(playVideoData.video);
                break;
            }

            case "tiktok-video":
            case "tiktok-vd":
            case "ttk-vd": {
                if (!fullArgs) {
                    throw new InvalidParameterError(
                        "Você precisa informar o link do video!"
                    );
                }
                await sendWaitReply("baixando sua música...");
                const playVideoData = await tiktok("video", fullArgs);
                if (!playVideoData) {
                    await sendErrorReply("Nenhum resultado encontrado!");
                    return;
                }
                await sendSuccessReact();
                await sendVideoFromURL(playVideoData.video);
                break;
            }

            case "up":
            case "upload":
            case "gerar-img":
            case "link": {
                if (!isImage) {
                    throw new InvalidParameterError(
                        "Você deve marcar ou responder uma imagem!"
                    );
                }
                await sendWaitReact();
                const fileName = getRandomName("png");
                const filePath = await downloadImage(webMessage, fileName);
                const buffer = fs.readFileSync(filePath);
                try {
                    const link = await upload(buffer, `${fileName}`);
                    if (!link) {
                        throw new Error(
                            "Erro ao fazer upload da imagem. Tente novamente mais tarde."
                        );
                    }
                    await sendSuccessReact();
                    await sendReply(
                        `Aqui está o link da sua imagem!\n\n- ${link}`
                    );
                } catch (error) {
                    errorLog(`Erro no upload: ${error.message}`);
                    throw new Error(
                        `Erro ao fazer upload da imagem: ${error.message}`
                    );
                } finally {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                break;
            }

            case "yt-search": {
                if (fullArgs.length <= 1) {
                    throw new InvalidParameterError(
                        "Você precisa fornecer uma pesquisa para o YouTube."
                    );
                }

                const maxLength = 100;

                if (fullArgs.length > maxLength) {
                    throw new InvalidParameterError(
                        `O tamanho máximo da pesquisa é de ${maxLength} caracteres.`
                    );
                }

                const data = await search("youtube", fullArgs);

                if (!data) {
                    throw new WarningError(
                        "Não foi possível encontrar resultados para a pesquisa."
                    );
                }

                let text = "";

                for (const item of data) {
                    text += `Título: *${item.title}*\n\n`;
                    text += `Duração: ${item.duration}\n\n`;
                    text += `Publicado em: ${item.published_at}\n\n`;
                    text += `Views: ${item.views}\n\n`;
                    text += `URL: ${item.url}\n\n-----\n\n`;
                }

                text = text.slice(0, -2);

                await sendSuccessReply(`*Pesquisa realizada*

*Termo*: ${fullArgs}

*Resultados*
${text}`);
                break;
            }

            case "youtube-mp3":
            case "yt-mp3": {
                if (!fullArgs.length) {
                    throw new InvalidParameterError(
                        "Você precisa enviar uma URL do YouTube!"
                    );
                }

                await sendWaitReact();

                if (!fullArgs.includes("you")) {
                    throw new WarningError("O link não é do YouTube!");
                }

                try {
                    const data = await download("yt-mp3", fullArgs);

                    if (!data) {
                        await sendErrorReply("Nenhum resultado encontrado!");
                        return;
                    }

                    await sendSuccessReact();

                    await sendImageFromURL(
                        data.thumbnail,
                        `*Título*: ${data.title}

*Descrição*: ${data.description}
*Duração em segundos*: ${data.total_duration_in_seconds}
*Canal*: ${data.channel.name}`
                    );

                    await sendAudioFromURL(data.url);
                } catch (error) {
                    console.log(error);
                    await sendErrorReply(error.message);
                }
                break;
            }

            case "youtube-mp4":
            case "yt-mp4": {
                if (!fullArgs.length) {
                    throw new InvalidParameterError(
                        "Você precisa enviar uma URL do YouTube!"
                    );
                }

                await sendWaitReact();

                if (!fullArgs.includes("you")) {
                    throw new WarningError("O link não é do YouTube!");
                }

                try {
                    const data = await download("yt-mp4", fullArgs);

                    if (!data) {
                        await sendErrorReply("Nenhum resultado encontrado!");
                        return;
                    }

                    await sendSuccessReact();

                    await sendImageFromURL(
                        data.thumbnail,
                        `*Título*: ${data.title}

*Descrição*: ${data.description}
*Duração em segundos*: ${data.total_duration_in_seconds}
*Canal*: ${data.channel.name}`
                    );

                    await sendVideoFromURL(data.url);
                } catch (error) {
                    console.log(error);
                    await sendErrorReply(error.message);
                }
                break;
            }

            default:
                break;
        }
    } catch (error) {
        if (error instanceof InvalidParameterError) {
            await sendWarningReply(`Parâmetros inválidos! ${error.message}`);
        } else if (error instanceof WarningError) {
            await sendWarningReply(error.message);
        } else if (error instanceof DangerError) {
            await sendErrorReply(error.message);
        } else {
            errorLog(
                `Erro ao executar comando "${command}"!\n\nDetalhes: ${
                    error.stack || error.message
                }`
            );
            await sendErrorReply(
                `Ocorreu um erro inesperado ao executar o comando *${command}*!\n\n📄 *Detalhes*: ${error.message}`
            );
        }
    }
}

module.exports = { startBot };
