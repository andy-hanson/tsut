/**
Integer type.
Equivalent to `number`, so for documentation only.
*/
export type Int = number

/**
Natural number (Int >= 0).
Equivalent to `number`, so for documentation only.
*/
export type Nat = number

/** `x + 1` */
export function incr(x: number): number {
	return x + 1
}

/** `x - 1` */
export function decr(x: number): number {
	return x - 1
}

/** Whether a number is non-negative and a safe integer. */
export function isNat(num: number): boolean {
	return num >= 0 && Number.isSafeInteger(num)
}

/** Asserts `Number.isSafeInteger`. */
export function checkInt(n: Int): void {
	if (!Number.isSafeInteger(n))
		throw new RangeError(`Must be an integer. Got ${n}.`)
}

/** Asserts [[isNat]]. */
export function checkNat(n: Nat): void {
	if (!isNat(n))
		throw new RangeError(`Must be a natural number. Got ${n}.`)
}

/** Whether the modulus is zero. */
export function divisible(numerator: Int, divisor: Nat): boolean {
	return numerator % divisor === 0
}

/** The `+` operator as a function. */
export function add(a: string, b: string): string
export function add(a: number, b: number): number
export function add(a: any, b: any): any {
	return a + b
}

/** The `-` operator as a function. */
export function subtract(a: number, b: number): number {
	return a - b
}

/** The `*` operator as a function. */
export function multiply(a: number, b: number): number {
	return a * b
}

/** The `/` operator as a function. */
export function divide(a: number, b: number): number {
	return a / b
}
