"use strict";
const function_1 = require("./function");
const seq_1 = require("./seq");
/**
Creates a revocable version of an object.
When `revoke` is called, the `proxy` will throw on all accesses.
Note that the *original* object is never revoked.
[[using]] provides a convenient way to create a proxy, use it, and revoke it.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable
*/
function revocable(object) {
    let revoked = false;
    const proxy = checkProxy(object, () => {
        if (revoked)
            throw new Error("Revoked!");
    });
    function revoke() {
        revoked = true;
    }
    return { proxy, revoke };
}
exports.revocable = revocable;
/**
Safely scopes access to an object.
`using(x, f)` acts like `f(x)`, except the reference to `x` may not escape the execution of `f`.

This works by passing `f` a revocable proxy to `x` instead of the original object;
when `f` ends, the proxy is revoked.

This is useful if you have some mutable state that you dont' want `f` to access.
Not that anything `x` references is *not* revoked.
*/
function using(object, use) {
    const { proxy, revoke } = revocable(object);
    try {
        return use(proxy);
    }
    finally {
        revoke();
    }
}
exports.using = using;
/** Like [[using]], but also calls `dispose` on the object before returning/ */
function disposing(object, use) {
    const { proxy, revoke } = revocable(object);
    try {
        return use(proxy);
    }
    finally {
        revoke();
        object.dispose();
    }
}
exports.disposing = disposing;
/**
Proxy for an object that only allows certain keys to be accessed.
For performance, this function is curried so that the proxy handler
only needs to be created once.

This can be used to disable downcasting of an object.

Usage:

    const makeSafePoint = picker<{ x: number }>(["x"])
    const xy = { x: 1, y: 2 }
    const justX = makeSafePoint(xy)
    justX.x // works
    (justX as any).y // Error
*/
function picker(keys) {
    const handler = pickingHandler(Set.from(keys));
    return object => new Proxy(object, handler);
}
exports.picker = picker;
function pickingHandler(keys) {
    function fail() {
        throw new TypeError(`Can only read from one of: ${seq_1.seq(keys).map(JSON.stringify).buildToString(", ")}`);
    }
    return failingHandler(fail, {
        has(target, prop) {
            // TODO: Cast not needed in typescript 2.0.5
            return keys.has(prop) && Reflect.has(target, prop);
        },
        get(target, prop) {
            if (!keys.has(prop))
                fail();
            else
                return target[prop];
        }
    });
}
/**
Proxy for an object that does not permit *direct* assignment.
Any methods that mutate it can still be called.
*/
function readonly(object) {
    return new Proxy(object, readonlyHandler);
}
exports.readonly = readonly;
const readonlyHandler = (() => {
    function fail() {
        throw new Error("This object is readonly.");
    }
    return failingHandler(fail, {
        getOwnPropertyDescriptor: Reflect.getOwnPropertyDescriptor,
        has: Reflect.has,
        get: Reflect.get,
        ownKeys: Reflect.ownKeys,
        apply: Reflect.apply,
        construct: Reflect.construct
    });
})();
function failingHandler(fail, otherCases) {
    const defaults = {
        getPrototypeOf: fail,
        setPrototypeOf: fail,
        isExtensible: fail,
        preventExtensions: fail,
        getOwnPropertyDescriptor: fail,
        defineProperty: fail,
        has: fail,
        get: fail,
        set: fail,
        deleteProperty: fail,
        ownKeys: fail,
        apply: fail,
        construct: fail
    };
    return Object.assign(defaults, otherCases);
}
function checkProxy(object, check) {
    return new Proxy(object, checkingHandler(check));
}
function checkingHandler(check) {
    function checking(op) {
        return function_1.before(op, check);
    }
    return {
        getPrototypeOf: checking(Reflect.getPrototypeOf),
        setPrototypeOf: checking(Reflect.setPrototypeOf),
        isExtensible: checking(Reflect.isExtensible),
        preventExtensions: checking(Reflect.preventExtensions),
        getOwnPropertyDescriptor: checking(Reflect.getOwnPropertyDescriptor),
        defineProperty: checking(Reflect.defineProperty),
        has: checking(Reflect.has),
        get: checking(Reflect.get),
        set: checking(Reflect.set),
        deleteProperty: checking(Reflect.deleteProperty),
        ownKeys: checking(Reflect.ownKeys),
        apply: checking(Reflect.apply),
        construct: checking(Reflect.construct)
    };
}
//# sourceMappingURL=reflect.js.map