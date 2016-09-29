import { removeUnordered } from "./array"
import { Option, exists } from "./option"

/** Modify the values in a map. */
export function mutateMapValues<K, V>(map: Map<K, V>, getOutput: (key: K, value: V) => V): void {
	for (const [key, value] of map)
		map.set(key, getOutput(key, value))
}

/** Modify the values in a map and remove entries for any undefined values. */
export function mutateMapValuesDefined<K, V>(map: Map<K, V>, tryGetOutput: (key: K, value: V) => Option<V>): void {
	for (const [key, value] of map) {
		const output = tryGetOutput(key, value)
		if (exists(output))
			map.set(key, output)
		else
			map.delete(key)
	}
}

/** Remove any entries not satisfying a predicate. */
export function filterMutateMap<K, V>(map: Map<K, V>, predicate: (key: K, value: V) => boolean): void {
	for (const [key, value] of map) {
		if (!predicate(key, value)) {
			map.delete(key)
		}
	}
}

/**
Adds new entries to a map.
See [[MapBuilder]] for documentation on `combineValues`.
*/
export function mapUnionMutate<K, V>(map: Map<K, V>, newEntries: Iterable<[K, V]>, combineValues?: (left: V, right: V) => V): void {
	if (exists(combineValues))
		for (const [key, value] of newEntries) {
			const oldValue = map.get(key)
			map.set(key, exists(oldValue) ? combineValues(oldValue, value) : value)
		}
	else
		for (const [key, value] of newEntries)
			map.set(key, value)
}

/** Add a value to a list of values with the same key. */
export function multiMapAdd<K, V>(map: Map<K, V[]>, key: K, value: V): V[] {
	const values = map.get(key)
	if (exists(values)) {
		values.push(value)
		return values
	} else {
		const newValues = [value]
		map.set(key, newValues)
		return newValues
	}
}

/**
Remove a value from a list of values with the same key.
Does not preserve order.
*/
export function multiMapRemove<K, V>(map: Map<K, V[]>, key: K, value: V): void {
	const values = map.get(key)
	if (values) {
		removeUnordered(values, value)
		if (values.length === 0)
			map.delete(key)
	}
}
