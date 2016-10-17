"use strict";
/** `x + 1` */
function incr(x) {
    return x + 1;
}
exports.incr = incr;
/** `x - 1` */
function decr(x) {
    return x - 1;
}
exports.decr = decr;
/** Whether a number is non-negative and a safe integer. */
function isNat(num) {
    return num >= 0 && Number.isSafeInteger(num);
}
exports.isNat = isNat;
/** Asserts `Number.isSafeInteger`. */
function checkInt(n) {
    if (!Number.isSafeInteger(n))
        throw new RangeError(`Must be an integer. Got ${n}.`);
}
exports.checkInt = checkInt;
/** Asserts [[isNat]]. */
function checkNat(n) {
    if (!isNat(n))
        throw new RangeError(`Must be a natural number. Got ${n}.`);
}
exports.checkNat = checkNat;
/** Whether the modulus is zero. */
function divisible(numerator, divisor) {
    return numerator % divisor === 0;
}
exports.divisible = divisible;
function add(a, b) {
    return a + b;
}
exports.add = add;
/** The `-` operator as a function. */
function subtract(a, b) {
    return a - b;
}
exports.subtract = subtract;
/** The `*` operator as a function. */
function multiply(a, b) {
    return a * b;
}
exports.multiply = multiply;
/** The `/` operator as a function. */
function divide(a, b) {
    return a / b;
}
exports.divide = divide;
//# sourceMappingURL=math.js.map