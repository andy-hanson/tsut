/** Converts an iterable to a Set if it isn't one already. */
export declare function toSet<T>(values: Iterable<T>): Set<T>;
/** Sets `target = target ⋃ source` */
export declare function unionMutate<T>(target: Set<T>, source: Iterable<T>): void;
/** Sets `target = target ⋂ source` */
export declare function intersectionMutate<T>(target: Set<T>, source: Iterable<T>): void;
/** Sets `target = target - source` */
export declare function differenceMutate<T>(target: Set<T>, source: Iterable<T>): void;
/** Set containing every element in every argument. */
export declare function union<T>(...args: Array<Iterable<T>>): Set<T>;
/**
Set containing only the elements common to both arguments.
This operation is faster when at least one argument is a Set.
*/
export declare function intersection<T>(left: Iterable<T>, right: Iterable<T>): Set<T>;
/** Set containing the only elements in `left` that are not in `right`. */
export declare function difference<T>(left: Iterable<T>, right: Iterable<T>): Set<T>;
/**
Throws out values in a set that do not satisfy a predicate.
(For an immutable version, use `seq(s).filter(predicate).toSet()`.)
*/
export declare function filterMutateSet<T>(set: Set<T>, predicate: (value: T) => boolean): void;
