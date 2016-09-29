import { Option, exists, or } from "./option"

/**
A type which accepts values and accumulates them into a result.
This is the complement of an Iterator: an Iterator generates values, a Builder accepts them.
*/
export interface Builder<Built, Added> {
	add(element: Added): void
	finish(): Built
}

/** Builds an Array. */
export class ArrayBuilder<T> implements Builder<T[], T> {
	private readonly array: T[] = []

	add(element: T): void {
		this.array.push(element)
	}

	finish(): T[] {
		return this.array
	}
}

/** Builds a Set. */
export class SetBuilder<T> implements Builder<Set<T>, T> {
	private readonly set = new Set<T>()

	add(element: T): void {
		this.set.add(element)
	}

	finish(): Set<T> {
		return this.set
	}
}

/**
Builds a Map.

If `combineValues` is omitted, newer values overwrite old ones.
If `combineValues` is provided, it combines two values sharing the same key.
Note that `combineValues` is not called if the previous value was `undefined`.
*/
export class MapBuilder<K, V> implements Builder<Map<K, V>, [K, V]> {
	private readonly map = new Map<K, V>()

	constructor(readonly combineValues?: (v1: V, v2: V, key: K) => V) {}

	add([key, value]: [K, V]): void {
		if (exists(this.combineValues)) {
			const previousValue = this.map.get(key)
			this.map.set(key,
				exists(previousValue) ? this.combineValues(previousValue, value, key) : value)
		} else
			this.map.set(key, value)
	}

	finish(): Map<K, V> {
		return this.map
	}
}

/** Builds a String. */
export class StringBuilder implements Builder<string, string> {
	private str: Option<string>

	constructor(readonly separator?: string) {}

	add(more: string): void {
		if (this.str === undefined)
			this.str = more
		else {
			if (exists(this.separator))
				this.str += this.separator
			this.str += more
		}
	}

	finish(): string {
		return or(this.str, () => "")
	}
}
