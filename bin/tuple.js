"use strict";
/** First element of a tuple. */
function _1st(tuple) {
    return tuple[0];
}
exports._1st = _1st;
/** Second element of a tuple. */
function _2nd(tuple) {
    return tuple[1];
}
exports._2nd = _2nd;
/** Third element of a tuple. */
function _3rd(tuple) {
    return tuple[2];
}
exports._3rd = _3rd;
/** Fourth element of a tuple. */
function _4th(tuple) {
    return tuple[3];
}
exports._4th = _4th;
function mod1st(tuple, f) {
    return [f(tuple[0]), ...tuple.slice(1)];
}
exports.mod1st = mod1st;
function mod2nd(tuple, f) {
    return [tuple[0], f(tuple[1]), ...tuple.slice(2)];
}
exports.mod2nd = mod2nd;
function mod3rd(tuple, f) {
    return [tuple[0], tuple[1], f(tuple[2]), ...tuple.slice(3)];
}
exports.mod3rd = mod3rd;
/** Applies a function to the third element of a tuple and returns the new tuple. */
function mod4th(tuple, f) {
    return [tuple[0], tuple[1], tuple[2], f(tuple[3])];
}
exports.mod4th = mod4th;
//# sourceMappingURL=tuple.js.map