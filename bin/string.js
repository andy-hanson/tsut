"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const math_1 = require("./math");
/**
Adds characters to the front until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
*/
function padStart(str, maxLength, filler = " ") {
    return maxLength <= str.length || filler === ""
        ? str
        : makeFiller(str, maxLength, filler) + str;
}
exports.padStart = padStart;
/**
Adds characters to the end until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
*/
function padEnd(str, maxLength, filler = " ") {
    return maxLength <= str.length || filler === ""
        ? str
        : str + makeFiller(str, maxLength, filler);
}
exports.padEnd = padEnd;
function makeFiller(str, maxLength, filler) {
    math_1.checkNat(maxLength);
    const fillLength = maxLength - str.length;
    while (filler.length < fillLength) {
        const remainingCodeUnits = fillLength - filler.length;
        if (filler.length > remainingCodeUnits)
            filler = filler + filler.slice(0, remainingCodeUnits);
        else
            filler += filler;
    }
    return filler.slice(0, fillLength);
}
/** Removes a known start string from the start of `str`, or throws an error. */
function stripStart(start, str) {
    if (!str.startsWith(start))
        throw new Error(`Expected ${JSON.stringify(str)} to start with ${JSON.stringify(start)}`);
    return str.slice(start.length);
}
exports.stripStart = stripStart;
/** Removes a known end string from the end of `str`, or throws an error. */
function stripEnd(str, end) {
    if (!str.endsWith(end))
        throw new Error(`Expected ${JSON.stringify(str)} to end with ${JSON.stringify(end)}`);
    return str.slice(0, str.length - end.length);
}
exports.stripEnd = stripEnd;
//# sourceMappingURL=string.js.map