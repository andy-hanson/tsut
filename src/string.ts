import { Nat, checkNat } from "./math"

/**
Adds characters to the front until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padStart
*/
export function padStart(str: string, maxLength: Nat, filler: string = " "): string {
	return maxLength <= str.length || filler === ""
		? str
		: makeFiller(str, maxLength, filler) + str
}

/**
Adds characters to the end until reaching `maxLength`.
See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd
*/
export function padEnd(str: string, maxLength: Nat, filler: string = " "): string {
	return maxLength <= str.length || filler === ""
		? str
		: str + makeFiller(str, maxLength, filler)
}

function makeFiller(str: string, maxLength: Nat, filler: string): string {
	checkNat(maxLength)
	const fillLength = maxLength - str.length
	while (filler.length < fillLength) {
		const remainingCodeUnits = fillLength - filler.length
		if (filler.length > remainingCodeUnits)
			filler = filler + filler.slice(0, remainingCodeUnits)
		else
			filler += filler
	}
	return filler.slice(0, fillLength)
}

/** Removes a known start string from the start of `str`, or throws an error. */
export function stripStart(start: string, str: string): string {
	if (!str.startsWith(start))
		throw new Error(`Expected ${JSON.stringify(str)} to start with ${JSON.stringify(start)}`)
	return str.slice(start.length)
}

/** Removes a known end string from the end of `str`, or throws an error. */
export function stripEnd(str: string, end: string): string {
	if (!str.endsWith(end))
		throw new Error(`Expected ${JSON.stringify(str)} to end with ${JSON.stringify(end)}`)
	return str.slice(0, str.length - end.length)
}
