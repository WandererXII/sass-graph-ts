# Sass-graph-ts

[![Test](https://github.com/WandererXII/sass-graph-ts/workflows/Test/badge.svg)](https://github.com/WandererXII/sass-graph-ts/actions)
[![npm](https://img.shields.io/npm/v/sass-graph-ts)](https://www.npmjs.com/package/sass-graph-ts)

Fork of https://github.com/xzyfer/sass-graph.
Rewritten in TypeScript, with updated dependencies and support for `@use` and `@forward`.

Parses Sass files in a directory and exposes a graph of dependencies.

## Install

```sh
npm install --save-dev sass-graph-ts
```

## Usage

Usage as a Node library:

```ts
import { SassGraph } from 'sass-graph-ts';

const graph: SassGraph = SassGraph.parseDir('/home/username/project/styles', {
  extensions: ['scss'],
});
```

Usage as a command line tool:

The command line tool will parse a graph and then either display ancestors, descendents or the whole index.

Run `sass-graph --help` for more details.

## API

#### parseDir

Parses a directory and builds a dependency graph of all requested file extensions.

#### parseFile

Parses a file and builds its dependency graph.

## Options

#### loadPaths

Type: `Array`
Default: `[process.cwd]`

Directories to use when resolved `@import` directives.

#### extensions

Type: `Array`
Default: `['scss', 'sass']`

File types to be parsed.

#### follow

Type: `Boolean`
Default: `false`

Follow symbolic links.

#### exclude

Type: `RegExp`
Default: `undefined`

Exclude files matching regular expression.

#### resolver

Type: `(string) => string | false;`
Default: `undefined`

Custom resolver for imports, return `false` to run default resolver. Might be useful for custom imports, or `pkg:` scheme.

## Example

```ts
import { SassGraph } from 'sass-graph-ts';

console.log(SassGraph.parseDir('test/fixtures'));

//{ index: {,
//    '/path/to/test/fixtures/a.scss': {
//        imports: ['b.scss'],
//        importedBy: [],
//    },
//    '/path/to/test/fixtures/b.scss': {
//        imports: ['_c.scss'],
//        importedBy: ['a.scss'],
//    },
//    '/path/to/test/fixtures/_c.scss': {
//        imports: [],
//        importedBy: ['b/scss'],
//    },
//}}
```

## Running Mocha tests

You can run the tests by executing the following commands:

```
npm install
npm test
```

## Authors

Sass graph was originally written by [Lachlan Donald](http://lachlan.me).
It is now maintained by [Michael Mifsud](http://twitter.com/xzyfer). TS rewrite by WandererXII.

## License

MIT
