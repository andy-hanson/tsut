declare global  {
    interface SetConstructor {
        /** Set containing the given values. */
        of<T>(...values: T[]): Set<T>;
        /** Set containing the given values. */
        from<T>(values: Iterable<T>): Set<T>;
    }
    interface MapConstructor {
        /** Map containing the given entries. */
        of<K, V>(...values: Array<[K, V]>): Map<K, V>;
        /** Map containing the given entries. */
        from<K, V>(values: Iterable<[K, V]>): Map<K, V>;
    }
}
export {};
