"use strict";
if (Set.of === undefined) {
    Set.of = (...values) => new Set(values);
}
if (Set.from === undefined) {
    Set.from = (values) => new Set(values);
}
if (Map.of === undefined) {
    Map.of = (...values) => new Map(values);
}
if (Map.from === undefined) {
    Map.from = (values) => new Map(values);
}
//# sourceMappingURL=shims.js.map