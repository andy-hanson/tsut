"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const function_1 = require("./function");
const option_1 = require("./option");
/** Used to indicate an expression to be filled in later. */
function TODO(reason = "TODO") {
    throw new Error(option_1.or(reason, function_1.thunk("TODO")));
}
exports.TODO = TODO;
/** Curried form of `===`. Useful to pass into `filter`-like functions. */
function eq(value) {
    return other => other === value;
}
exports.eq = eq;
/** Function that ignores all arguments. */
function ignore() { }
exports.ignore = ignore;
/** Useful for throwing an Error in expression position. */
function raise(error) {
    throw option_1.exists(error) ? error : new Error();
}
exports.raise = raise;
//# sourceMappingURL=misc.js.map