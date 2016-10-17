"use strict";
const option_1 = require("./option");
/** Builds an Array. */
class ArrayBuilder {
    constructor() {
        this.array = [];
    }
    add(element) {
        this.array.push(element);
    }
    finish() {
        return this.array;
    }
}
exports.ArrayBuilder = ArrayBuilder;
/** Builds a Set. */
class SetBuilder {
    constructor() {
        this.set = new Set();
    }
    add(element) {
        this.set.add(element);
    }
    finish() {
        return this.set;
    }
}
exports.SetBuilder = SetBuilder;
/**
Builds a Map.

If `combineValues` is omitted, newer values overwrite old ones.
If `combineValues` is provided, it combines two values sharing the same key.
Note that `combineValues` is not called if the previous value was `undefined`.
*/
class MapBuilder {
    constructor(combineValues) {
        this.combineValues = combineValues;
        this.map = new Map();
    }
    add([key, value]) {
        if (option_1.exists(this.combineValues)) {
            const previousValue = this.map.get(key);
            this.map.set(key, option_1.exists(previousValue) ? this.combineValues(previousValue, value, key) : value);
        }
        else
            this.map.set(key, value);
    }
    finish() {
        return this.map;
    }
}
exports.MapBuilder = MapBuilder;
/** Builds a String. */
class StringBuilder {
    constructor(separator) {
        this.separator = separator;
    }
    add(more) {
        if (this.str === undefined)
            this.str = more;
        else {
            if (option_1.exists(this.separator))
                this.str += this.separator;
            this.str += more;
        }
    }
    finish() {
        return option_1.or(this.str, () => "");
    }
}
exports.StringBuilder = StringBuilder;
//# sourceMappingURL=builder.js.map