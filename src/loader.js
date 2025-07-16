/**
 * Este script é responsável
 * por carregar os eventos
 * que serão escutados pelo
 * socket do WhatsApp.
 *
 *  Este recurso foi adaptado para Jarvis-bot
 * @author Dev Gui
 */
const { TIMEOUT_IN_MILLISECONDS_BY_EVENT } = require("./config");
const { startBot } = require("./index");
const { onGroupParticipantsUpdate } = require("./middlewares/onGroupParticipantsUpdate");

const path = require("node:path");
const { errorLog, warningLog } = require("./utils/logger");
const { badMacHandler } = require("./utils/badMacHandler");

exports.load = (socket) => {
    global.BASE_DIR = path.resolve(__dirname);

    const safeEventHandler = async (callback, data, eventName) => {
        try {
            await callback(data);
        } catch (error) {
            if (badMacHandler.handleError(error, eventName)) {
                return;
            }
            errorLog(`Erro ao processar evento ${eventName}: ${error.message}`);
            if (error.stack) {
                errorLog(`Stack trace: ${error.stack}`);
            }
        }
    };

    socket.ev.on("messages.upsert", async data => {
        const startProcess = Date.now();
        setTimeout(() => {
            safeEventHandler(
                () =>
                    startBot({
                        socket,
                        data,
                        startProcess
                    }),
                data,
                "messages.upsert"
            );
        }, TIMEOUT_IN_MILLISECONDS_BY_EVENT);
    });

    socket.ev.on("group-participants.update", async (data) => {
        safeEventHandler(
            () => onGroupParticipantsUpdate(data, socket),
            data,
            "group-participants.update"
        );
    });

    process.on("uncaughtException", error => {
        if (badMacHandler.handleError(error, "uncaughtException")) {
            return;
        }
        errorLog(`Erro não capturado: ${error.message}`);
        if (error.stack) {
            errorLog(`Stack trace: ${error.stack}`);
        }
    });

    process.on("unhandledRejection", reason => {
        if (badMacHandler.handleError(reason, "unhandledRejection")) {
            return;
        }
        errorLog(`Promessa rejeitada não tratada: ${reason}`);
        if (reason instanceof Error && reason.stack) {
            errorLog(`Stack trace: ${reason.stack}`);
        }
    });
};
