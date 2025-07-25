const path = require("path");

// Prefixo dos comandos.
exports.PREFIX = "/";

// Emoji do bot (mude se preferir).
exports.BOT_EMOJI = "🤖";

// Nome do bot (mude se preferir).
exports.BOT_NAME = "JARVIS BOT";

// Número do bot. Coloque o número do bot
// (apenas números, exatamente como está no WhatsApp).
exports.BOT_NUMBER = "557192100391";

// Número do dono do bot. Coloque o número do dono do bot
// (apenas números, exatamente como está no WhatsApp).
exports.OWNER_NUMBER = "559392179287";

// LID do dono do bot.
// Para obter o LID do dono do bot, use o comando <prefixo>get-lid @marca ou +telefone do dono.
exports.OWNER_LID = "219999999999999@lid";

// modo de desenvolvimento
// mude o valor para ( true ) caso queira ver os logs de mensagens e eventos capturados
exports.DEVELOPER_MODE = false;

// Diretório de arquivos de mídia.
exports.ASSETS_DIR = path.resolve(__dirname, "..", "assets");

// Diretório de arquivos Json ( dados ).
exports.DATABASE_DIR = path.resolve(__dirname, "..", "database");

// Diretório de arquivos temporários.
exports.TEMP_DIR = path.resolve(__dirname, "..", "assets", "temp");

// Diretório de credenciais do Baileys.
exports.BAILEYS_CREDS_DIR = path.resolve(
    __dirname,
    "..",
    "assets",
    "auth",
    "baileys"
);

// Timeout em milissegundos por ação (evitar banimento do número).
exports.TIMEOUT_IN_MILLISECONDS_BY_ACTION = 700;

// Caso queira responder apenas um grupo específico,
// coloque o ID dele na configuração abaixo.
// Para saber o ID do grupo, use o comando <prefixo>getid
// Troque o <prefixo> pelo prefixo do bot (ex: /get-id).
exports.ONLY_GROUP_ID =  "" // "120363393114929135@g.us";

// Plataforma de API's
exports.SPIDER_API_BASE_URL = "https://api.spiderx.com.br/api";

exports.SHADOW_API_BASE_URL = "https://shadow-api-3vz5.onrender.com/api";

// Obtenha seu token, criando uma conta em: https://api.spiderx.com.br
exports.SPIDER_API_TOKEN = "seu_token_aqui";

// Obtenha seu token, criando uma conta em: https://shadow-api-3vz5.onrender.com
exports.SHADOW_API_TOKEN = "seu_token_aqui";
