const fs = require("node:fs");
const path = require("node:path");
const { downloadContentFromMessage, delay } = require("baileys");

const {
    baileysIs,
    checkPrefix,
    deleteTempFile,
    download,
    extractDataFromMessage,
    formatCommand,
    getBuffer,
    getContent,
    getProfileImageData,
    getRandomName,
    getRandomNumber,
    onlyLettersAndNumbers,
    onlyNumbers,
    removeAccentsAndSpecialCharacters,
    splitByCharacters,
    toUserJid
} = require(".");
const {
    TEMP_DIR,
    PREFIX,
    BOT_EMOJI,
    OWNER_NUMBER,
    TIMEOUT_IN_MILLISECONDS_BY_ACTION
} = require("../config");
const { errorLog } = require("./logger");
const { exec } = require("node:child_process");
const { DangerError } = require("../errors");

function loadCommandFunctions({ socket, data }) {
    if (!data?.messages?.length) return null;

    const webMessage = data.messages[0];
    const remoteJid = webMessage?.key?.remoteJid;

    const {
        args,
        body,
        command,
        from,
        fullArgs,
        isReply,
        prefix,
        replyJid,
        userJid
    } = extractDataFromMessage(webMessage);

    if (!from) return null;

    const isAudio = baileysIs(webMessage, "audio");
    const isImage = baileysIs(webMessage, "image");
    const isVideo = baileysIs(webMessage, "video");
    const isSticker = baileysIs(webMessage, "sticker");
    const isGroup = !!remoteJid?.endsWith("@g.us");
    const isGroupWithLid = !!userJid?.endsWith("@lid");

    const withRetry = async (fn, maxRetries = 3, delayMs = 1000) => {
        let lastError;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) await delay(delayMs * attempt);
            }
        }
        throw lastError;
    };

    const downloadAudio = async (webMessage, fileName) =>
        download(webMessage, fileName, "audio", "mpeg");
    const downloadImage = async (webMessage, fileName) =>
        download(webMessage, fileName, "image", "png");
    const downloadSticker = async (webMessage, fileName) =>
        download(webMessage, fileName, "sticker", "webp");
    const downloadVideo = async (webMessage, fileName) =>
        download(webMessage, fileName, "video", "mp4");

    const sendTypingState = async (anotherJid = "") => {
        const sendToJid = anotherJid || remoteJid;
        await socket.sendPresenceUpdate("composing", sendToJid);
        await delay(TIMEOUT_IN_MILLISECONDS_BY_ACTION);
    };

    const sendRecordState = async (anotherJid = "") => {
        const sendToJid = anotherJid || remoteJid;
        await socket.sendPresenceUpdate("recording", sendToJid);
        await delay(TIMEOUT_IN_MILLISECONDS_BY_ACTION);
    };

    const sendText = async (text, mentions = []) => {
        await sendTypingState();
        const optionalParams = mentions?.length ? { mentions } : {};
        return await socket.sendMessage(remoteJid, {
            text: `${BOT_EMOJI} ${text}`,
            ...optionalParams
        });
    };

    const sendReply = async (text, mentions = []) => {
        await sendTypingState();
        const optionalParams = mentions?.length ? { mentions } : {};
        return await socket.sendMessage(
            remoteJid,
            { text: `${BOT_EMOJI} ${text}`, ...optionalParams },
            { quoted: webMessage }
        );
    };

    const sendReact = async (emoji, msgKey = webMessage.key) =>
        socket.sendMessage(remoteJid, {
            react: { text: emoji, key: msgKey }
        });

    const sendSuccessReact = async () => sendReact("✅");
    const sendWaitReact = async () => sendReact("⏳");
    const sendWarningReact = async () => sendReact("⚠️");
    const sendErrorReact = async () => sendReact("❌");

    const sendSuccessReply = async (text, mentions = []) => {
        await sendSuccessReact();
        return sendReply(`✅ ${text}`, mentions);
    };

    const sendWaitReply = async (text, mentions = []) => {
        await sendWaitReact();
        return sendReply(
            `⏳ Aguarde! ${text || "Carregando dados..."}`,
            mentions
        );
    };

    const sendPaymentRequest = async (
        remoteJid,
        value,
        currencyCode,
        caption
    ) => {
        const amount1000Value = value * 10;

        const paymentDetails = {
            requestPaymentMessage: {
                currencyCodeIso4217: currencyCode,
                amount1000: amount1000Value.toString(),
                noteMessage: {
                    extendedTextMessage: { text: caption ? caption : "" }
                },
                expiryTimestamp: "0",
                amount: {
                    value: value.toString(),
                    offset: 2,
                    currencyCode: currencyCode
                }
            }
        };

        await socket.relayMessage(remoteJid, paymentDetails, {});
    };

    const sendWarningReply = async (text, mentions = []) => {
        await sendWarningReact();
        return sendReply(`⚠️ Atenção! ${text}`, mentions);
    };

    const sendErrorReply = async (text, mentions = []) => {
        await sendErrorReact();
        return sendReply(`❌ Erro! ${text}`, mentions);
    };

    const sendStickerFromFile = async (file, quoted = true) =>
        socket.sendMessage(
            remoteJid,
            { sticker: fs.readFileSync(file) },
            quoted ? { quoted: webMessage } : {}
        );

    const sendStickerFromURL = async (url, quoted = true) =>
        socket.sendMessage(
            remoteJid,
            { sticker: { url } },
            { url, ...(quoted ? { quoted: webMessage } : {}) }
        );

    const sendStickerFromBuffer = async (buffer, quoted = true) =>
        socket.sendMessage(
            remoteJid,
            { sticker: buffer },
            quoted ? { quoted: webMessage } : {}
        );

    const sendImageFromFile = async (
        file,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        withRetry(async () =>
            socket.sendMessage(
                remoteJid,
                {
                    image: fs.readFileSync(file),
                    caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                    ...(mentions?.length ? { mentions } : {})
                },
                quoted ? { quoted: webMessage } : {}
            )
        );

    const sendImageFromURL = async (
        url,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        withRetry(async () =>
            socket.sendMessage(
                remoteJid,
                {
                    image: { url },
                    caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                    ...(mentions?.length ? { mentions } : {})
                },
                { url, ...(quoted ? { quoted: webMessage } : {}) }
            )
        );

    const sendImageFromBuffer = async (
        buffer,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        withRetry(async () =>
            socket.sendMessage(
                remoteJid,
                {
                    image: buffer,
                    caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                    ...(mentions?.length ? { mentions } : {})
                },
                quoted ? { quoted: webMessage } : {}
            )
        );

    const sendVideoFromFile = async (
        file,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: fs.readFileSync(file),
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                ...(mentions?.length ? { mentions } : {})
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendVideoFromURL = async (
        url,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: { url },
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                ...(mentions?.length ? { mentions } : {})
            },
            { url, ...(quoted ? { quoted: webMessage } : {}) }
        );

    const sendVideoFromBuffer = async (
        buffer,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: buffer,
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                ...(mentions?.length ? { mentions } : {})
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendAudioFromFile = async (
        filePath,
        asVoice = false,
        quoted = true
    ) => {
        return socket.sendMessage(
            remoteJid,
            {
                audio: fs.readFileSync(filePath),
                mimetype: "audio/mpeg",
                ptt: asVoice
            },
            quoted ? { quoted: webMessage } : {}
        );
    };

    const sendAudioFromURL = async (url, asVoice = false, quoted = true) => {
        return socket.sendMessage(
            remoteJid,
            { audio: { url }, mimetype: "audio/mpeg", ptt: asVoice },
            { url, ...(quoted ? { quoted: webMessage } : {}) }
        );
    };

    const sendAudioFromBuffer = async (
        buffer,
        asVoice = false,
        quoted = true
    ) => {
        return socket.sendMessage(
            remoteJid,
            { audio: buffer, mimetype: "audio/mpeg", ptt: asVoice },
            quoted ? { quoted: webMessage } : {}
        );
    };

    const sendGifFromFile = async (
        file,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: fs.readFileSync(file),
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                gifPlayback: true,
                ...(mentions?.length ? { mentions } : {})
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendGifFromURL = async (
        url,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: { url },
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                gifPlayback: true,
                ...(mentions?.length ? { mentions } : {})
            },
            { url, ...(quoted ? { quoted: webMessage } : {}) }
        );

    const sendGifFromBuffer = async (
        buffer,
        caption = "",
        mentions = [],
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                video: buffer,
                caption: caption ? `${BOT_EMOJI} ${caption}` : "",
                gifPlayback: true,
                ...(mentions?.length ? { mentions } : {})
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendDocumentFromFile = async (
        file,
        mimetype,
        fileName,
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                document: fs.readFileSync(file),
                mimetype: mimetype || "application/octet-stream",
                fileName: fileName || "documento.pdf"
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendDocumentFromURL = async (
        url,
        mimetype,
        fileName,
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                document: { url },
                mimetype: mimetype || "application/octet-stream",
                fileName: fileName || "documento.pdf"
            },
            { url, ...(quoted ? { quoted: webMessage } : {}) }
        );

    const sendDocumentFromBuffer = async (
        buffer,
        mimetype,
        fileName,
        quoted = true
    ) =>
        socket.sendMessage(
            remoteJid,
            {
                document: buffer,
                mimetype: mimetype || "application/octet-stream",
                fileName: fileName || "documento.pdf"
            },
            quoted ? { quoted: webMessage } : {}
        );

    const sendPoll = async (title, options, singleChoice = false) =>
        socket.sendMessage(remoteJid, {
            poll: {
                name: `${BOT_EMOJI} ${title}`,
                selectableCount: singleChoice ? 1 : 0,
                toAnnouncementGroup: true,
                values: options.map(option => option.optionName)
            }
        });

    const sendContact = async (displayName, phoneNumber, quoted = true) => {
        const cleanPhoneNumber = onlyNumbers(phoneNumber);

        if (cleanPhoneNumber.length < 10 || cleanPhoneNumber.length > 15) {
            throw new Error("Número de telefone inválido!");
        }

        const vcard = `BEGIN:VCARD\nVERSION:3.0\nN:;${displayName};;;\nFN:${displayName}\nitem1.TEL;waid=${cleanPhoneNumber}:+${cleanPhoneNumber}\nitem1.X-ABLabel:Celular\nEND:VCARD`;

        return socket.sendMessage(
            remoteJid,
            {
                contacts: {
                    displayName: displayName,
                    contacts: [{ vcard }]
                }
            },
            quoted ? { quoted: webMessage } : {}
        );
    };

    const sendButton = async (
        text,
        buttons,
        footer,
        header = { type: "text" },
        quoted = true
    ) => {
        const buttonsMessage = {
            contentText: `${BOT_EMOJI} ${text}`,
            footerText: footer,
            buttons: buttons.map(btn => ({
                buttonId: btn.id,
                buttonText: {
                    displayText: btn.text
                },
                type: "RESPONSE"
            })),
            headerType: header.type === "image" ? "IMAGE" : "TEXT"
        };

        if (header.type === "image" && header.content) {
            buttonsMessage.imageMessage = {
                url: header.content,
                mimetype: "image/jpeg"
            };
        } else {
            if (header.type === "text" && header.content) {
                buttonsMessage.text = `${BOT_EMOJI} ${header.content}`;
            }
        }

        return await socket.sendMessage(
            remoteJid,
            buttonsMessage,
            quoted ? { quoted: webMessage } : {}
        );
    };

    const deleteMessage = async key => {
        const { id, remoteJid, participant } = key;
        await socket.sendMessage(remoteJid, {
            delete: { remoteJid, fromMe: false, id, participant }
        });
    };

    const getGroupMetadata = async (groupJid = remoteJid) => {
        if (!groupJid.endsWith("@g.us")) return null;
        return socket.groupMetadata(groupJid);
    };

    const getGroupName = async (groupJid = remoteJid) => {
        const metadata = await getGroupMetadata(groupJid);
        return metadata?.subject || "";
    };

    const getGroupOwner = async (groupJid = remoteJid) => {
        const metadata = await getGroupMetadata(groupJid);
        return metadata?.owner || "";
    };

    const getGroupParticipants = async (groupJid = remoteJid) => {
        const metadata = await getGroupMetadata(groupJid);
        return metadata?.participants || [];
    };

    const getGroupAdmins = async (groupJid = remoteJid) => {
        const participants = await getGroupParticipants(groupJid);
        return participants
            .filter(p => p.admin === "admin" || p.admin === "superadmin")
            .map(p => p.id);
    };

    const ban = async (remoteJid, userJid) => {
        await socket.groupParticipantsUpdate(remoteJid, [userJid], "remove");
    };

    return {
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
        remoteJid,
        replyJid,
        socket,
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
        sendButton,
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
    };
}

module.exports = { loadCommandFunctions };
