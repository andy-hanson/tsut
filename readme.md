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
npm install --save andy-hanson/tsut # Latest
npm install --save tsut # Stable
```

#### Configure

You must use `"target": "es6"` and `"moduleResolution": "node"` (or `"module": "commonjs"`) in your `tsconfig.json`.

#### Import

```ts
import * as u from "tsut";
```

#### Call

```ts
console.log(u.difference([1, 2, 3], [3, 1])) // Set { 2 }
```


### The utilities

The main modules are:

| Module | For |
| ------ | --- |
| [`option`](http://andy-hanson.me/tsut/doc/modules/_option_.html) | For using `Option`s (`Option<T> = T | undefined`) |
| [`function`](http://andy-hanson.me/tsut/doc/modules/_function_.html) | Common higher-order functions. |
| [`seq`](http://andy-hanson.me/tsut/doc/modules/_seq_.html) | For using `Iterable`s. |
| [`asyncSeq`](http://andy-hanson.me/tsut/doc/modules/_asyncseq_.html) | For using `AsyncIterable`s. |
| [`parallel`](http://andy-hanson.me/tsut/doc/classes/_parallel_.parallelseq.html) | Like `asyncSeq` but runs operations in parallel. |
| [`async`](http://andy-hanson.me/tsut/doc/modules/_async_.html) | For using `Promise`s and async functions. |
| [`array`](http://andy-hanson.me/tsut/doc/modules/_array_.html) | Array helpers. |
| [`string`](http://andy-hanson.me/tsut/doc/modules/_string_.html) | For using `String`s. |
| [`map`](http://andy-hanson.me/tsut/doc/modules/_map_.html) | For using `Map`s. |
| [`set`](http://andy-hanson.me/tsut/doc/modules/_set_.html) | For using `Set`s.

Other modules are:

| Module | For |
| ------ | --- |
| [`misc`](http://andy-hanson.me/tsut/doc/modules/_misc_.html) | Other useful functions. |
| [`math`](http://andy-hanson.me/tsut/doc/modules/_math_.html) | For using `number`s. |
| [`range`](http://andy-hanson.me/tsut/doc/modules/_range_.html) | Ranges of numbers. |
| [`tuple`](http://andy-hanson.me/tsut/doc/modules/_tuple_.html) | For using tuples. |
| [`types`](http://andy-hanson.me/tsut/doc/modules/_types_.html) | Easier `typeof` tests. |
| [`reflect`](http://andy-hanson.me/tsut/doc/modules/_reflect_.html) | Common `Proxy`s. |
| [`shims`](http://andy-hanson.me/tsut/doc/modules/_shims_.__global.html) | ES-next shims. |
| [`builder`](http://andy-hanson.me/tsut/doc/modules/_builder_.html) | Builders for data structures. Used internally by `seq` and `asyncSeq`. |

If you're like me you may prefer to just read the [source code](https://github.com/andy-hanson/tsut/blob/master/src/option.ts).


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
