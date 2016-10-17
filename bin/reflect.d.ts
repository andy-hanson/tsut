/**
Creates a revocable version of an object.
When `revoke` is called, the `proxy` will throw on all accesses.
Note that the *original* object is never revoked.
[[using]] provides a convenient way to create a proxy, use it, and revoke it.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/revocable
*/
export declare function revocable<T>(object: T): {
    proxy: T;
    revoke: () => void;
};
/**
Safely scopes access to an object.
`using(x, f)` acts like `f(x)`, except the reference to `x` may not escape the execution of `f`.

This works by passing `f` a revocable proxy to `x` instead of the original object;
when `f` ends, the proxy is revoked.

This is useful if you have some mutable state that you dont' want `f` to access.
Not that anything `x` references is *not* revoked.
*/
export declare function using<T, U>(object: T, use: (object: T) => U): U;
/** Like [[using]], but also calls `dispose` on the object before returning/ */
export declare function disposing<T extends {
    dispose(): void;
}, U>(object: T, use: (object: T) => U): U;
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
export declare function picker<T>(keys: PropertyKey[]): (object: T) => T;
/**
Proxy for an object that does not permit *direct* assignment.
Any methods that mutate it can still be called.
*/
export declare function readonly<T>(object: T): T;
