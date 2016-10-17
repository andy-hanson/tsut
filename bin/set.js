"use strict";
const seq_1 = require("./seq");
/** Converts an iterable to a Set if it isn't one already. */
function toSet(values) {
    return values instanceof Set ? values : Set.from(values);
}
exports.toSet = toSet;
/** Sets `target = target ⋃ source` */
function unionMutate(target, source) {
    for (const element of source)
        target.add(element);
}
exports.unionMutate = unionMutate;
/** Sets `target = target ⋂ source` */
function intersectionMutate(target, source) {
    const sourceSet = toSet(source);
    filterMutateSet(target, element => sourceSet.has(element));
}
exports.intersectionMutate = intersectionMutate;
/** Sets `target = target - source` */
function differenceMutate(target, source) {
    const sourceSet = toSet(source);
    filterMutateSet(target, element => !sourceSet.has(element));
}
exports.differenceMutate = differenceMutate;
/** Set containing every element in every argument. */
function union(...args) {
    const s = new Set();
    for (const arg of args)
        unionMutate(s, arg);
    return s;
}
exports.union = union;
/**
Set containing only the elements common to both arguments.
This operation is faster when at least one argument is a Set.
*/
function intersection(left, right) {
    const [a, b] = left instanceof Set
        ? [left, right]
        : right instanceof Set
            ? [right, left]
            : [Set.from(left), right];
    const out = new Set();
    for (const value of b)
        if (a.has(value))
            out.add(value);
    return out;
}
exports.intersection = intersection;
/** Set containing the only elements in `left` that are not in `right`. */
function difference(left, right) {
    return seq_1.Seq.from(left).difference(right).toSet();
}
exports.difference = difference;
/**
Throws out values in a set that do not satisfy a predicate.
(For an immutable version, use `seq(s).filter(predicate).toSet()`.)
*/
function filterMutateSet(set, predicate) {
    for (const value of set)
        if (!predicate(value))
            set.delete(value);
}
exports.filterMutateSet = filterMutateSet;
//# sourceMappingURL=set.js.map