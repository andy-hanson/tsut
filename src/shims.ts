import {} from "./array" // Make this a module

declare global {
	// https://github.com/leobalter/proposal-setmap-offrom

	interface SetConstructor {
		/** Set containing the given values. */
		of<T>(...values: T[]): Set<T>
		/** Set containing the given values. */
		from<T>(values: Iterable<T>): Set<T>
	}

	interface MapConstructor {
		/** Map containing the given entries. */
		of<K, V>(...values: [K, V][]): Map<K, V>
		/** Map containing the given entries. */
		from<K, V>(values: Iterable<[K, V]>): Map<K, V>
	}
}

if (Set.of === undefined) {
	Set.of = <T>(...values: T[]) => new Set(values)
}

if (Set.from === undefined) {
	Set.from = <T>(values: Iterable<T>) => new Set(values)
}

if (Map.of === undefined) {
	Map.of = <K, V>(...values: [K, V][]) => new Map(values)
}

if (Map.from === undefined) {
	Map.from = <K, V>(values: Iterable<[K, V]>) => new Map(values)
}
