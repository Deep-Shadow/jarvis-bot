/**
 * Arquivo de exportação
 * dos erros
 * customizados.
 *
 * @author MRX@DEV
 */
const { DangerError } = require("./DangerError");
const { InvalidParameterError } = require("./InvalidParameterError");
const { WarningError } = require("./WarningError");

module.exports = {
    DangerError,
    InvalidParameterError,
    WarningError
};
