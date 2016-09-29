`tsut` is a set of generic utilities useful to all TypeScript programmers.
It's designed to be as generic and simple as possible. The utilities are just those that should be familiar to all programmers.
`tsut` should be useful regardless of whether you're doing client or server work, and regardless of the framework you choose to use.
It does not define new data structures, just functions that are useable on their own --
so you can use it for only one utility without bringing in any baggage, and just write normal TypeScript code.

The utilities are divided into modules for better organization,
but you can use a single import `import * as u from "tsut"` and use any function from that.

### Use it

#### Install

```sh
npm install --save tsut
```

#### Configure

You must use `"target": "es6"` in your `tsconfig.json`.

#### Import

```ts
import * as u from "tsut";
```

#### Call

```ts
console.log(u.difference([1, 2, 3], [3, 1]))
```


### The utilities

The main modules are:

| Module | For |
| ------ | --- |
| `option` | For using `Option`s (`Option<T> = T | undefined`) |
| `function` | Common higher-order functions. |
| `seq` | For using `Iterable`s. |
| `asyncSeq` | For using `AsyncIterable`s. |
| `parallel` | Like `asyncSeq` but runs operations in parallel. |
| `async` | For using `Promise`s and async functions. |
| `array` | Array helpers. |
| `string` | For using `String`s. |
| `map` | For using `Map`s. |
| `set` | For using `Set`s.

Other modules are:

| Module | For |
| ------ | --- |
| `misc` | Other useful functions. |
| `math` | For using `number`s. |
| `range` | Ranges of numbers. |
| `tuple` | For using tuples. |
| `types` | Easier `typeof` tests. |
| `reflect` | Common `Proxy`s. |
| `shims` | ES-next shims. |
| `builder` | Builders for data structures. Used internally by `seq` and `asyncSeq`. |

Documentation is [here]().
If that's not enough, the source code is readable, so you can [dive in](https://github.com/andy-hanson/tsut/blob/master/src/option.ts).


### Why isn't X included?

| X | Why |
| - | --- |
| Data structures | [typescript-collections](https://github.com/basarat/typescript-collections)
| Random utilities | [chance](http://chancejs.com/) |
| Date utilities | [moment](http://momentjs.com/) |
| More math utilities | I haven't found a good library for this. |


### Get Help

File an [issue](https://github.com/andy-hanson/tsut/issues) if you have trouble using tsut.


### Contribute

* [Fork](https://guides.github.com/activities/forking) the repository.
* `npm install` and `npm run all` (If this didn't work for you, file an issue.)
* Make a change to a module, e.g. `src/array.ts`
	- If adding a new module, remember to add it to `index.ts`. Don't use a default export because that can't be re-exported.
* Modify the corresponding file `test/array.ts`.
* `npm install -g mocha`
* Test your change with `mocha --require test/mocha-require.js test/array.ts`
* Before committing anything:
	- `npm run lint` and fix any lint errors
	- `npm run coverage` and fix any missing coverage.
	- `npm run doc` and check that it rendered correctly.

Utility functions that are generically useful will likely be accepted.

Functions that are server-side or client-side specific,
or which are only useful in certain domains (e.g. validating emails),
belong in different projects.
