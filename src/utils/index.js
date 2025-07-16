const fs = require("node:fs");
const axios = require("axios");
const path = require("node:path");
const { writeFile } = require("fs/promises");
const { downloadContentFromMessage, delay } = require("baileys");

const { errorLog } = require("./logger");
const { PREFIX, TEMP_DIR } = require("../config");
const { checkUserRole } = require("../middlewares/checkUserRole");

function extractDataFromMessage(webMessage) {
    const textMessage = webMessage.message?.conversation;
    const extendedTextMessage = webMessage.message?.extendedTextMessage;
    const extendedTextMessageText = extendedTextMessage?.text;
    const imageTextMessage = webMessage.message?.imageMessage?.caption;
    const videoTextMessage = webMessage.message?.videoMessage?.caption;

    const body =
        textMessage ||
        extendedTextMessageText ||
        imageTextMessage ||
        videoTextMessage;

    if (!body) {
        return {
            args: [],
            body: "",
            command: "",
            from: "",
            fullArgs: "",
            isReply: false,
            prefix: "",
            replyJid: "",
            userJid: ""
        };
    }

    const isReply =
        !!extendedTextMessage &&
        !!extendedTextMessage.contextwebMessage?.quotedMessage;

    const replyJid =
        !!extendedTextMessage &&
        !!extendedTextMessage.contextwebMessage?.participant
            ? extendedTextMessage.contextwebMessage.participant
            : null;

    const userJid = webMessage?.key?.participant?.replace(
        /:[0-9][0-9]|:[0-9]/g,
        ""
    );

    const [command, ...args] = body.split(" ");

    const prefix = command.charAt(0);

    const commandWithoutPrefix = command.replace(
        new RegExp(`^[${PREFIX}]+`),
        ""
    );

    return {
        args: splitByCharacters(args.join(" "), ["\\", "|", "/"]),
        body,
        command: formatCommand(commandWithoutPrefix),
        from: webMessage?.key?.remoteJid,
        fullArgs: args.join(" "),
        isReply,
        prefix,
        replyJid,
        userJid
    };
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function onlyLettersAndNumbers(text) {
    return text.replace(/[^a-zA-Z0-9]/g, "");
}

function removeAccentsAndSpecialCharacters(text) {
    if (!text) {
        return "";
    }

    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function onlyNumbers(text) {
    if (!text) {
        return "";
    }

    return text.replace(/[^0-9]/g, "");
}

function deleteTempFile(file) {
    setTimeout(() => {
        try {
            if (file && fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        } catch (error) {
            errorLog(
                "Erro ao deletar arquivo temporário!\n\n",
                JSON.stringify(error, null, 2)
            );
        }
    }, 30_000);
}

function formatCommand(text) {
    return onlyLettersAndNumbers(
        removeAccentsAndSpecialCharacters(text.toLocaleLowerCase().trim())
    );
}

function splitByCharacters(str, characters) {
    characters = characters.map(char => (char === "\\" ? "\\\\" : char));
    const regex = new RegExp(`[${characters.join("")}]`);

    return str
        .split(regex)
        .map(str => str.trim())
        .filter(Boolean);
}

function baileysIs(webMessage, context) {
    return !!getContent(webMessage, context);
}

function getContent(webMessage, context) {
    return (
        webMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[
            `${context}Message`
        ] ||
        webMessage?.message?.viewOnceMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.viewOnceMessage?.message?.[`${context}Message`] ||
        webMessage?.message?.viewOnceMessageV2?.message?.[
            `${context}Message`
        ] ||
        webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage
            ?.viewOnceMessageV2?.message?.[`${context}Message`]
    );
}

function checkPrefix(prefix) {
    return PREFIX === prefix;
}

async function download(webMessage, fileName, context, extension) {
    const content = getContent(webMessage, context);

    if (!content) {
        return null;
    }

    const stream = await downloadContentFromMessage(content, context);

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }

    const filePath = path.resolve(TEMP_DIR, `${fileName}.${extension}`);

    await writeFile(filePath, buffer);

    return filePath;
}

function isLink(text) {
    const regex =
        /(https?:\/\/(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/\S*)?)/g;

    return regex.test(text);
}

function toUserJid(number) {
    return `${onlyNumbers(number)}@s.whatsapp.net`;
}

function getBuffer(url, options) {
    return new Promise((resolve, reject) => {
        axios({
            method: "get",
            url,
            headers: {
                DNT: 1,
                "Upgrade-Insecure-Request": 1,
                range: "bytes=0-"
            },
            ...options,
            responseType: "arraybuffer",
            proxy: options?.proxy || false
        })
            .then(res => {
                resolve(res.data);
            })
            .catch(reject);
    });
}

async function getJSON(url, options) {
    try {
        const { data } = await axios.get(url, options);

        return data;
    } catch (error) {
        return null;
    }
}

function getRandomName(extension) {
    const fileName = getRandomNumber(0, 999999);

    if (!extension) {
        return fileName.toString();
    }

    return `${fileName}.${extension}`;
}

function readMore() {
    const invisibleBreak = "\u200B".repeat(950);
    return invisibleBreak;
}

async function randomDelay() {
    const values = [1000, 2000, 3000];
    return await delay(values[getRandomNumber(0, values.length - 1)]);
}

const isAdmin = async (jid, from, socket) => {
    return await checkUserRole(jid, "admin", from, socket);
};

const isOwner = async (jid, from, socket) => {
    return await checkUserRole(jid, "owner", from, socket);
};

const isBotOwner = async (jid, remoteJid, socket) => {
    return await checkUserRole(jid, "botOwner", remoteJid, socket);
};

module.exports = {
    baileysIs,
    checkPrefix,
    delay,
    deleteTempFile,
    download,
    extractDataFromMessage,
    formatCommand,
    getBuffer,
    getContent,
    getJSON,
    getRandomName,
    getRandomNumber,
    isAdmin,
    isOwner,
    isBotOwner,
    isLink,
    onlyLettersAndNumbers,
    onlyNumbers,
    randomDelay,
    readMore,
    removeAccentsAndSpecialCharacters,
    splitByCharacters,
    toUserJid
};
