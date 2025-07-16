const path = require("path");

// Prefixo dos comandos.
exports.PREFIX = "$";

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

// Plataforma de API's
exports.SPIDER_API_BASE_URL = "https://api.spiderx.com.br/api";

exports.SHADOW_API_BASE_URL = "https://shadow-api-3vz5.onrender.com/api";

// Obtenha seu token, criando uma conta em: https://api.spiderx.com.br
exports.SPIDER_API_TOKEN = "seu_token_aqui";

// Obtenha seu token, criando uma conta em: https://shadow-api-3vz5.onrender.com
exports.SHADOW_API_TOKEN = "seu_token_aqui";
