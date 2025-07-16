/**
 * Menu de comandos do bot
 *
 * @author MRX@DEV
 */
const { BOT_NAME, PREFIX } = require("../config");

exports.menu = () => {
    const date = new Date();

    return `╭━━⪩ BEM VINDO! ⪨━━
▢
▢ • Data: ${date.toLocaleDateString("pt-br")}
▢ • Hora: ${date.toLocaleTimeString("pt-br")}
▢
▢ • Prefixo: ${PREFIX}
▢
╰━━─「🪐」─━━

╭━━⪩ DONO ⪨━━
▢
▢ • ${PREFIX}exec
▢ • ${PREFIX}imagemenu
▢ • ${PREFIX}off
▢ • ${PREFIX}on
▢
╰━━─「🌌」─━━

╭━━⪩ ADMINS ⪨━━
▢
▢ • ${PREFIX}abrir
▢ • ${PREFIX}antilink (1/0)
▢ • ${PREFIX}ban
▢ • ${PREFIX}delete
▢ • ${PREFIX}fechar
▢ • ${PREFIX}hidetag
▢ • ${PREFIX}limpar
▢ • ${PREFIX}promover
▢ • ${PREFIX}rebaixar
▢
╰━━─「⭐」─━━

╭━━⪩ PRINCIPAL ⪨━━
▢
▢ • ${PREFIX}ai
▢ • ${PREFIX}attp 
▢ • ${PREFIX}blur 
▢ • ${PREFIX}cep
▢ • ${PREFIX}contraste
▢ • ${PREFIX}dado
▢ • ${PREFIX}enquete
▢ • ${PREFIX}espelhar 
▢ • ${PREFIX}fakechat
▢ • ${PREFIX}getjid
▢ • ${PREFIX}gra
▢ • ${PREFIX}ig
▢ • ${PREFIX}mute 
▢ • ${PREFIX}perfil
▢ • ${PREFIX}ping
▢ • ${PREFIX}pin
▢ • ${PREFIX}pixel
▢ • ${PREFIX}playudio
▢ • ${PREFIX}playvideo
▢ • ${PREFIX}raw
▢ • ${PREFIX}rename
▢ • ${PREFIX}revelar
▢ • ${PREFIX}sticker
▢ • ${PREFIX}toimage
▢ • ${PREFIX}ttp
▢ • ${PREFIX}upload
▢ • ${PREFIX}teste
▢
╰━━─「🚀」─━━`;
};
