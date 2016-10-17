import { Option } from "./option";
/** Modify the values in a map. */
export declare function mutateMapValues<K, V>(map: Map<K, V>, getOutput: (key: K, value: V) => V): void;
/** Modify the values in a map and remove entries for any undefined values. */
export declare function mutateMapValuesDefined<K, V>(map: Map<K, V>, tryGetOutput: (key: K, value: V) => Option<V>): void;
/** Remove any entries not satisfying a predicate. */
export declare function filterMutateMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): void;
/**
Adds new entries to a map.
See [[MapBuilder]] for documentation on `combineValues`.
*/
export declare function mapUnionMutate<K, V>(map: Map<K, V>, newEntries: Iterable<[K, V]>, combineValues?: (left: V, right: V) => V): void;
/** Add a value to a list of values with the same key. */
export declare function multiMapAdd<K, V>(map: Map<K, V[]>, key: K, value: V): V[];
/**
Remove a value from a list of values with the same key.
Does not preserve order.
*/
export declare function multiMapRemove<K, V>(map: Map<K, V[]>, key: K, value: V): void;
