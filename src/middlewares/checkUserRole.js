const { OWNER_NUMBER } = require("../config"); 

exports.checkUserRole = async (jid, type, remoteJid, socket) => {
    try {
        const botOwnerJid = `${OWNER_NUMBER.replace(/[^0-9]/g, "")}@s.whatsapp.net`;
        const isBotOwner = jid === botOwnerJid;

        if (type === "botOwner") {
            return isBotOwner;
        }

        if (!remoteJid?.endsWith("@g.us")) {
            return false;
        }

        const { participants, owner } = await socket.groupMetadata(remoteJid);
        const participant = participants.find(
            participant => participant.id === jid
        );

        if (!participant) return false;

        const isGroupOwner = participant.id === owner;
        const isGroupAdmin =
            participant.admin === "admin" || participant.admin === "superadmin";

        if (type === "owner") {
            return isGroupOwner || isBotOwner;
        }

        if (type === "admin") {
            return isGroupAdmin || isGroupOwner || isBotOwner;
        }

        return false;
    } catch (error) {
        console.error("Error checking user permission:", error);
        return false;
    }
};