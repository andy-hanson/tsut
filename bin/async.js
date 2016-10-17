"use strict";
/**
Use a callback-style function, returning a Promise.
For example: `callback(cb => fs.readFile("foo.txt", "utf-8", cb))
*/
function callback(callbackUser) {
    return new Promise((resolve, reject) => {
        callbackUser((error, result) => {
            if (error !== null && error !== undefined)
                reject(error);
            else
                resolve(result);
        });
    });
}
exports.callback = callback;
function promisify(f) {
    return (...args) => new Promise((resolve, reject) => {
        f(...args, (error, result) => {
            if (error !== null && error !== undefined)
                reject(error);
            else
                resolve(result);
        });
    });
}
exports.promisify = promisify;
/** Wrap a value in `Promise.resolve` if necessary. */
function toPromise(value) {
    return value instanceof Promise ? value : Promise.resolve(value);
}
exports.toPromise = toPromise;
/** Promise that takes a given amount of time to be resolved. */
function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}
exports.sleep = sleep;
/**
Create a new Promise and a Deferred for resolving it.
Usually it is more convenient to just call the Promise constructor directly.
*/
function deferred() {
    // Prophecy has been fulfilled. https://github.com/Microsoft/TypeScript/issues/11463#issuecomment-252469934
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    return [{ resolve: resolve, reject: reject }, promise];
}
exports.deferred = deferred;
//# sourceMappingURL=async.js.map