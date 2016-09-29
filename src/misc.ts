import { Predicate, thunk } from "./function"
import { exists, or } from "./option"

/** Used to indicate an expression to be filled in later. */
export function TODO(reason: string = "TODO"): never {
	throw new Error(or(reason, thunk("TODO")))
}

/** Curried form of `===`. Useful to pass into `filter`-like functions. */
export function eq<T>(value: T): Predicate<T> {
	return other => other === value
}

/** Function that ignores all arguments. */
export function ignore(): void {}

/** Useful for throwing an Error in expression position. */
export function raise(error?: Error): never {
	throw exists(error) ? error : new Error()
}
