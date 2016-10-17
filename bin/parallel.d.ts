import { AnyIterable, AsyncSeq } from "./asyncSeq";
import { Nat } from "./math";
import { Option } from "./option";
/**
Wraps an [[AsyncSeq]] to provide parallel utilities.
That these do not chaing to ParallelSeq; methods return [[AsyncSeq]]s.
Note: This does not parallelize the *wrapped* sequence. It only runs *future* operations in parallel.
*/
export declare class ParallelSeq<T> {
    /** Wrapped sequence. */
    readonly seq: AsyncSeq<T>;
    /**
    Number of threads to run at once.
    You'll have to profile to determine an optimal number.
    */
    readonly maxNumberOfThreads: Nat;
    constructor(
        /** Wrapped sequence. */
        seq: AsyncSeq<T>, 
        /**
        Number of threads to run at once.
        You'll have to profile to determine an optimal number.
        */
        maxNumberOfThreads?: Nat);
    /** Limits the number of threads that may run at once. */
    nThreads(maxNumberOfThreads: number): ParallelSeq<T>;
    /** [[AsyncSeq.each]] that works on [[maxNumberOfThreads]] inputs at a time. */
    each(action: (input: T) => Promise<void>): Promise<void>;
    /** [[AsyncSeq.map]] that works on [[maxNumberOfThreads]] inputs at a time. */
    map<U>(mapper: (input: T) => Promise<U>): AsyncSeq<U>;
    /**
    [[AsyncSeq.flatMap]] that works on [[maxNumberOfThreads]] inputs at a time.
    Runs `getOutputs` in parallel, but the sequences it returns are *not* run in parallel.
    */
    flatMap<U>(getOutputs: (input: T) => Promise<Option<AnyIterable<U>>>): AsyncSeq<U>;
    /** [[AsyncSeq.mapDefined]] that works on [[maxNumberOfThreads]] inputs at a time. */
    mapDefined<U>(tryGetOutput: (input: T) => Promise<Option<U>>): AsyncSeq<U>;
    /** [[AsyncSeq.filter]] that works on [[maxNumberOfThreads]] inputs at a time. */
    filter(predicate: (element: T) => Promise<boolean>): AsyncSeq<T>;
}
