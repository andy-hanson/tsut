/**
A type which accepts values and accumulates them into a result.
This is the complement of an Iterator: an Iterator generates values, a Builder accepts them.
*/
export interface Builder<Built, Added> {
    add(element: Added): void;
    finish(): Built;
}
/** Builds an Array. */
export declare class ArrayBuilder<T> implements Builder<T[], T> {
    private readonly array;
    add(element: T): void;
    finish(): T[];
}
/** Builds a Set. */
export declare class SetBuilder<T> implements Builder<Set<T>, T> {
    private readonly set;
    add(element: T): void;
    finish(): Set<T>;
}
/**
Builds a Map.

If `combineValues` is omitted, newer values overwrite old ones.
If `combineValues` is provided, it combines two values sharing the same key.
Note that `combineValues` is not called if the previous value was `undefined`.
*/
export declare class MapBuilder<K, V> implements Builder<Map<K, V>, [K, V]> {
    readonly combineValues: (v1: V, v2: V, key: K) => V;
    private readonly map;
    constructor(combineValues?: (v1: V, v2: V, key: K) => V);
    add([key, value]: [K, V]): void;
    finish(): Map<K, V>;
}
/** Builds a String. */
export declare class StringBuilder implements Builder<string, string> {
    readonly separator: string;
    private str;
    constructor(separator?: string);
    add(more: string): void;
    finish(): string;
}
