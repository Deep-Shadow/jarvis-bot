const fs = require("node:fs");
const path = require("node:path");
const { DATABASE_DIR } = require("../config");

const databasePath = DATABASE_DIR;

const FILES = {
    INACTIVE_GROUPS: "inactive-groups",
    INACTIVE_AUTO_RESPONDER_GROUPS_FILE: "inactive-auto-responder-groups",
    NOT_WELCOME_GROUPS: "not-welcome-groups",
    NOT_EXIT_GROUPS: "not-exit-groups",
    ANTI_OWNER_TAG_GROUPS: "anti-owner-tag-groups",
    MUTE_FILE: "muted",
    ANTI_LINK_GROUPS: "anti-link-groups"
};

function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
    }
}

function readJSON(fileName) {
    const filePath = path.resolve(databasePath, `${fileName}.json`);
    ensureFileExists(filePath);

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJSON(fileName, data) {
    const filePath = path.resolve(databasePath, `${fileName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data));
}

function addGroup(fileName, groupId) {
    const groups = readJSON(fileName);

    if (!groups.includes(groupId)) {
        groups.push(groupId);
        writeJSON(fileName, groups);
    }
}

function removeGroup(fileName, groupId) {
    const groups = readJSON(fileName);
    const index = groups.indexOf(groupId);

    if (index !== -1) {
        groups.splice(index, 1);
        writeJSON(fileName, groups);
    }
}

function isGroupActive(fileName, groupId, invert = true) {
    const groups = readJSON(fileName);

    return invert ? !groups.includes(groupId) : groups.includes(groupId);
}

exports.addGroup = addGroup;

exports.activateGroup = (groupId) => removeGroup(FILES.INACTIVE_GROUPS, groupId);

exports.deactivateGroup = (groupId) => addGroup(FILES.INACTIVE_GROUPS, groupId);

exports.isActiveGroup = (groupId) =>
    isGroupActive(FILES.INACTIVE_GROUPS, groupId);

exports.getAutoResponderResponse = match => {
    const filename = "auto-responder";

    const responses = readJSON(filename);

    const matchUpperCase = match.toLocaleUpperCase();

    const data = responses.find(
        response => response.match.toLocaleUpperCase() === matchUpperCase
    );

    if (!data) {
        return null;
    }

    return data.answer;
};

exports.activateAutoResponderGroup = (groupId) => {
    const filename = FILES.INACTIVE_AUTO_RESPONDER_GROUPS_FILE;

    const inactiveAutoResponderGroups = readJSON(filename);

    const index = inactiveAutoResponderGroups.indexOf(groupId);

    if (index === -1) {
        return;
    }

    inactiveAutoResponderGroups.splice(index, 1);

    writeJSON(filename, inactiveAutoResponderGroups);
};

exports.deactivateAutoResponderGroup = (groupId) => {
    const filename = FILES.INACTIVE_AUTO_RESPONDER_GROUPS_FILE;

    const inactiveAutoResponderGroups = readJSON(filename);

    if (!inactiveAutoResponderGroups.includes(groupId)) {
        inactiveAutoResponderGroups.push(groupId);
    }

    writeJSON(filename, inactiveAutoResponderGroups);
};

exports.isActiveAutoResponderGroup = (groupId) => {
    const filename = FILES.INACTIVE_AUTO_RESPONDER_GROUPS_FILE;

    const inactiveAutoResponderGroups = readJSON(filename);

    return !inactiveAutoResponderGroups.includes(groupId);
};

exports.activateWelcomeGroup = (groupId) =>
    removeGroup(FILES.NOT_WELCOME_GROUPS, groupId);

exports.deactivateWelcomeGroup = (groupId) =>
    addGroup(FILES.NOT_WELCOME_GROUPS, groupId);

exports.isActiveWelcomeGroup = (groupId) =>
    isGroupActive(FILES.NOT_WELCOME_GROUPS, groupId);
    
exports.activateAntiLinkGroup = (groupId) =>
    addGroup(FILES.ANTI_LINK_GROUPS, groupId);

exports.deactivateAntiLinkGroup = (groupId) =>
    removeGroup(FILES.ANTI_LINK_GROUPS, groupId);

exports.isActiveAntiLinkGroup = (groupId) =>
    isGroupActive(FILES.ANTI_LINK_GROUPS, groupId, false);

exports.isActiveExitGroup = (groupId) => 
    isGroupActive(FILES.NOT_EXIT_GROUPS, groupId);

exports.activateAntiOwnerTag = (groupId) => {
  if (!groupId) return [];
  
  addGroup(FILES.ANTI_OWNER_TAG_GROUPS, groupId);
}

exports.deactivateAntiOwnerTag = (groupId) => {
  if (!groupId) return [];
  
  removeGroup(FILES.ANTI_OWNER_TAG_GROUPS, groupId);
}

exports.isActiveAntiOwnerTagGroup = (groupId) => 
  isGroupActive(FILES.ANTI_OWNER_TAG_GROUPS, groupId, false);
