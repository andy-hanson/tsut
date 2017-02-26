"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Convert a value which may be `null` to one which may be `undefined`. */
function optionify(nullable) {
    return nullable === null ? undefined : nullable;
}
exports.optionify = optionify;
/** True for any value but `undefined`. */
function exists(option) {
    return option !== undefined;
}
exports.exists = exists;
/**
Create an optional value if some condition is true.
Never write `else return undefined` again!
*/
function optional(condition, result) {
    return condition ? result() : undefined;
}
exports.optional = optional;
/** Return the value iff the predicate is satisfied. */
function keepIf(value, predicate) {
    return predicate(value) ? value : undefined;
}
exports.keepIf = keepIf;
/** Get the value of an option or throw an error. */
function orThrow(option, error) {
    if (exists(option))
        return option;
    else
        throw exists(error) ? error() : new TypeError("Option was undefined.");
}
exports.orThrow = orThrow;
/**
Use an option iff it exists.
This is like the safe-navigation ("one-eyed elvis") operator: `iff(foo, f => f.bar)` is `foo?.bar`.
*/
function iff(option, map) {
    return exists(option) ? map(option) : undefined;
}
exports.iff = iff;
function or(option, getDefault) {
    return exists(option) ? option : getDefault();
}
exports.or = or;
/** Combine two options only if they both exist. */
function and(a, b, combine) {
    return exists(a) && exists(b) ? combine(a, b) : undefined;
}
exports.and = and;
/**
True iff `a === b` or `equal(a, b)`.
Does not call `equal` if either input is undefined.
*/
function equalOptions(a, b, equal) {
    return a === b || exists(a) && exists(b) && equal(a, b);
}
exports.equalOptions = equalOptions;
//# sourceMappingURL=option.js.map