"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const array_1 = require("./array");
const option_1 = require("./option");
/** Modify the values in a map. */
function mutateMapValues(map, getOutput) {
    for (const [key, value] of map)
        map.set(key, getOutput(key, value));
}
exports.mutateMapValues = mutateMapValues;
/** Modify the values in a map and remove entries for any undefined values. */
function mutateMapValuesDefined(map, tryGetOutput) {
    for (const [key, value] of map) {
        const output = tryGetOutput(key, value);
        if (option_1.exists(output))
            map.set(key, output);
        else
            map.delete(key);
    }
}
exports.mutateMapValuesDefined = mutateMapValuesDefined;
/** Remove any entries not satisfying a predicate. */
function filterMutateMap(map, predicate) {
    for (const [key, value] of map) {
        if (!predicate(key, value)) {
            map.delete(key);
        }
    }
}
exports.filterMutateMap = filterMutateMap;
/**
Adds new entries to a map.
See [[MapBuilder]] for documentation on `combineValues`.
*/
function mapUnionMutate(map, newEntries, combineValues) {
    if (option_1.exists(combineValues))
        for (const [key, value] of newEntries) {
            const oldValue = map.get(key);
            map.set(key, option_1.exists(oldValue) ? combineValues(oldValue, value) : value);
        }
    else
        for (const [key, value] of newEntries)
            map.set(key, value);
}
exports.mapUnionMutate = mapUnionMutate;
/** Add a value to a list of values with the same key. */
function multiMapAdd(map, key, value) {
    const values = map.get(key);
    if (option_1.exists(values)) {
        values.push(value);
        return values;
    }
    else {
        const newValues = [value];
        map.set(key, newValues);
        return newValues;
    }
}
exports.multiMapAdd = multiMapAdd;
/**
Remove a value from a list of values with the same key.
Does not preserve order.
*/
function multiMapRemove(map, key, value) {
    const values = map.get(key);
    if (values) {
        array_1.removeUnordered(values, value);
        if (values.length === 0)
            map.delete(key);
    }
}
exports.multiMapRemove = multiMapRemove;
//# sourceMappingURL=map.js.map