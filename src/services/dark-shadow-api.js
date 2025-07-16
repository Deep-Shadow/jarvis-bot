const axios = require("axios");

const { SHADOW_API_TOKEN, SHADOW_API_BASE_URL } = require("../config");

/**
 * Não configure o token da Dark Shadow API aqui, configure em: src/config.js
 */
const shadowAPITokenConfigured =
    SHADOW_API_TOKEN && SHADOW_API_TOKEN !== "seu_token_aqui";

exports.shadowAPITokenConfigured = shadowAPITokenConfigured;

const play = async (type, search) => {
    if (!search) {
        throw new Error("Você precisa informar o que deseja buscar!");
    }

    if (!shadowAPITokenConfigured) {
        throw new Error("Token da API não configurado");
    }

    const { data } = await axios.get(
        `${SHADOW_API_BASE_URL}/play-${type}?query=${encodeURIComponent(
            search
        )}&token=${SHADOW_API_TOKEN}`
    );

    return data;
};

const instagram = async (type, url) => {
    if (!url) {
        throw new Error("Você precisa informar o link do vídeo!");
    }

    if (!shadowAPITokenConfigured) {
        throw new Error("Token da API não configurado");
    }

    const { data } = await axios.get(
        `${SHADOW_API_BASE_URL}/instagram?url=${encodeURIComponent(
            url
        )}&token=${SHADOW_API_TOKEN}`
    );

    return data.data[0];
};

const tiktok = async (type, query) => {
    if (!query) {
        throw new Error(
            "Você precisa informar o link do vídeo ou a sua pesquisa!"
        );
    }

    if (!shadowAPITokenConfigured) {
        throw new Error("Token da API Shadow não configurado.");
    }

    let data;

    if (type === "search") {
        const response = await axios.get(
            `${SHADOW_API_BASE_URL}/tiktok-${type}?query=${encodeURIComponent(
                query
            )}&token=${SHADOW_API_TOKEN}`
        );
        data = response.data;
    } else if (type == "audio" || type == "video") {
        const response = await axios.get(
            `${SHADOW_API_BASE_URL}/tiktok-video2?url=${encodeURIComponent(
                query
            )}&token=${SHADOW_API_TOKEN}`
        );
        data = response.data;
    }

    return data;
};

const pinterest_search = async (query) => {
    if (!query) {
        throw new Error("Você precisa informar um termo de busca!");
    }

    if (!shadowAPITokenConfigured) {
        throw new Error("Token da API Shadow não configurado.");
    }

    const { data } = await axios.get(
        `${SHADOW_API_BASE_URL}/pinterest-search?query=${encodeURIComponent(
            query
        )}&token=${SHADOW_API_TOKEN}`
    );

    return data;
};

module.exports = {
    instagram,
    play,
    pinterest_search,
    tiktok
};
