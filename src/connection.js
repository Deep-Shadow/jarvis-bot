/**
 * Script de inicialização do bot.
 *
 * Este script é responsável por iniciar a conexão com o WhatsApp.
 *
 * Não é recomendado alterar este arquivo, a menos que você saiba
 * o que está fazendo.
 *
 * @author MRX@DEV
 */
const path = require("node:path");
const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    isJidBroadcast,
    isJidStatusBroadcast,
    proto,
    isJidNewsletter,
    makeCacheableSignalKeyStore
} = require("baileys");
const pino = require("pino");
const NodeCache = require("node-cache");

const { BAILEYS_CREDS_DIR, TEMP_DIR } = require("./config");
const { onlyNumbers } = require("./utils");
const {
    textInput,
    infoLog,
    warningLog,
    errorLog,
    successLog,
    bannerLog
} = require("./utils/logger");
const { badMacHandler } = require("./utils/badMacHandler");
const { load } = require("./loader");

const logger = pino(
    { timestamp: () => `,"time":"${new Date().toJSON()}"` },
    pino.destination(path.join(TEMP_DIR, "wa-logs.txt"))
);
logger.level = "error";

const msgRetryCounterCache = new NodeCache();

bannerLog();

async function startConnection() {
    const { state, saveCreds } = await useMultiFileAuthState(BAILEYS_CREDS_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const socket = makeWASocket({
        version,
        logger,
        defaultQueryTimeoutMs: undefined,
        retryRequestDelayMs: 5000,
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger)
        },
        shouldIgnoreJid: (jid) =>
            isJidBroadcast(jid) ||
            isJidStatusBroadcast(jid) ||
            isJidNewsletter(jid),
        keepAliveIntervalMs: 30_000,
        maxMsgRetryCount: 5,
        markOnlineOnConnect: true,
        syncFullHistory: false,
        msgRetryCounterCache,
        shouldSyncHistoryMessage: () => false,
        getMessage: async (key) => {
            return proto.Message.fromObject({});
        }
    });

    if (!socket.authState.creds.registered) {
        warningLog("Credenciais ainda não configuradas!");
        infoLog(
            'Informe o número de telefone do bot (exemplo: "5511920202020"):'
        );

        const phoneNumber = await textInput(
            "Informe o número de telefone do bot: "
        );

        if (!phoneNumber) {
            errorLog(
                'Número de telefone inválido! Tente novamente com o comando "npm start".'
            );
            process.exit(1);
        }

        const code = await socket.requestPairingCode(onlyNumbers(phoneNumber));
        infoLog(`Código de pareamento: ${code}`);
    }

    socket.ev.on("connection.update", async update => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const error = lastDisconnect?.error;
            const statusCode = error?.output?.statusCode;

            if (
                error?.message?.includes("Bad MAC") ||
                error?.toString()?.includes("Bad MAC")
            ) {
                errorLog("Bad MAC error na desconexão detectado");
                if (badMacHandler.handleError(error, "connection.update")) {
                    if (badMacHandler.hasReachedLimit()) {
                        warningLog(
                            "Limite de erros Bad MAC atingido. Limpando arquivos de sessão problemáticos..."
                        );
                        await badMacHandler.clearProblematicSessionFiles();
                        badMacHandler.resetErrorCount();
                        startConnection();
                        return;
                    }
                }
            }

            if (statusCode === DisconnectReason.loggedOut) {
                errorLog("Bot desconectado!");
                badMacHandler.resetErrorCount();
            } else {
                switch (statusCode) {
                    case DisconnectReason.badSession:
                        warningLog("Sessão inválida!");
                        const sessionError = new Error("Bad session detected");
                        if (
                            badMacHandler.handleError(
                                sessionError,
                                "badSession"
                            )
                        ) {
                            if (badMacHandler.hasReachedLimit()) {
                                warningLog(
                                    "Limite de erros de sessão atingido. Limpando arquivos de sessão..."
                                );
                                await badMacHandler.clearProblematicSessionFiles();
                                badMacHandler.resetErrorCount();
                            }
                        }
                        break;
                    case DisconnectReason.connectionClosed:
                        warningLog("Conexão fechada!");
                        break;
                    case DisconnectReason.connectionLost:
                        warningLog("Conexão perdida!");
                        break;
                    case DisconnectReason.connectionReplaced:
                        warningLog("Conexão substituída!");
                        break;
                    case DisconnectReason.multideviceMismatch:
                        warningLog("Dispositivo incompatível!");
                        break;
                    case DisconnectReason.forbidden:
                        warningLog("Conexão proibida!");
                        break;
                    case DisconnectReason.restartRequired:
                        infoLog('Me reinicie por favor! Digite "npm start".');
                        break;
                    case DisconnectReason.unavailableService:
                        warningLog("Serviço indisponível!");
                        break;
                }
                startConnection();
            }
        } else if (connection === "open") {
            successLog("Fui conectado com sucesso!");
            badMacHandler.resetErrorCount();
            load(socket);
        } else {
            infoLog("Atualizando conexão...");
        }
    });

    socket.ev.on("creds.update", saveCreds);

    return socket;
}

startConnection();
