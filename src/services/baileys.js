const fs = require("node:fs");
const path = require("node:path");

const { TEMP_DIR, ASSETS_DIR } = require("../config");
const { getBuffer, getRandomName, deleteTempFile } = require("../utils");

exports.getProfileImageData = async (userJid, socket) => {
    let profileImage = "";
    let buffer = null;
    let success = true;

    try {
        profileImage = await socket.profilePictureUrl(userJid, "image");

        buffer = await getBuffer(profileImage);

        const tempImage = path.resolve(TEMP_DIR, getRandomName("png"));

        fs.writeFileSync(tempImage, buffer);

        profileImage = tempImage;
    } catch (error) {
        success = false;

        profileImage = path.resolve(ASSETS_DIR, "images", "default-user.png");

        buffer = fs.readFileSync(profileImage);
    }
    return { buffer, profileImage, success };
};
