"use strict";
const option_1 = require("./option");
const seq_1 = require("./seq");
/**
[low, high): The range including low but not including high.
Use like: `for (const i of range(0, 10)) ...`
*/
function range(start, end, step) {
    return new Range(start, end, step);
}
exports.range = range;
/** Type returned by [[range]]. */
class Range {
    constructor(start, end, step) {
        this.start = start;
        this.end = end;
        if (option_1.exists(step)) {
            if (Math.sign(step) !== Math.sign(end - start))
                throw new Error(`Step must be in the direction start -> end: wanted ${start} -> ${end}, got ${step}`);
            this.step = step;
        }
        else
            this.step = Math.sign(end - start) || 1;
    }
    *[Symbol.iterator]() {
        if (this.start < this.end) {
            let n = this.start;
            while (n < this.end) {
                yield n;
                n += this.step;
            }
        }
        else {
            let n = this.start;
            while (n > this.end) {
                yield n;
                n += this.step;
            }
        }
    }
    /** Wraps this in a [[Seq]]. */
    get seq() {
        return seq_1.seq(this);
    }
    /** Reverse range, e.g. 1, 2, 3 becomes 3, 2, 1. */
    get reverse() {
        return new Range(this.end, this.start, -this.step);
    }
    /** Size of the range. Always positive. */
    get span() {
        return Math.abs(this.end - this.start);
    }
    /**
    Whether a number is contained in the range [start, end].
    (That notation means: including both ends.)
    */
    spanContains(value) {
        const { start, end } = this;
        return start < end
            ? value >= start && value <= end
            : value <= start && value >= end;
    }
    /** Increases or decreases a value so that the range contains it. */
    clamp(value) {
        const { start, end } = this;
        return start < end
            ? value < start ? start : value > end ? end : value
            : value > start ? start : value < end ? end : value;
    }
}
Range.nats = new Range(0, Number.POSITIVE_INFINITY);
exports.Range = Range;
//# sourceMappingURL=range.js.map