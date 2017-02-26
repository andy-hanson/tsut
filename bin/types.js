"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Whether it is a primitive boolean. */
function isBoolean(x) {
    return typeof x === "boolean";
}
exports.isBoolean = isBoolean;
/** Whether it is a primitive number. */
function isNumber(x) {
    return typeof x === "number";
}
exports.isNumber = isNumber;
/** Whether it is a primitive string. */
function isString(x) {
    return typeof x === "string";
}
exports.isString = isString;
/** Whether it is a symbol. */
function isSymbol(x) {
    return typeof x === "symbol";
}
exports.isSymbol = isSymbol;
/** Whether it is a function. */
function isFunction(x) {
    return typeof x === "function";
}
exports.isFunction = isFunction;
/**
Whether it is not a primitive and not a function.
Note that this does *not* include `null`.
*/
function isObject(x) {
    return typeof x === "object" && x !== null;
}
exports.isObject = isObject;
//# sourceMappingURL=types.js.map