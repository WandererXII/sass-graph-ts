import { assert } from 'chai';
import path from 'path';
import { SassGraph } from '../dist/sass-graph.js';

var fixtures = path.resolve(path.join('test', 'fixtures'));

export function fixture(name) {
  return function (file) {
    if (!file) file = 'index.scss';
    return path.join(fixtures, name, file);
  };
}

export function graph(opts) {
  var instance, dir, isIndentedSyntax;

  function indexFile() {
    if (isIndentedSyntax) {
      return 'index.sass';
    }
    return 'index.scss';
  }

  return {
    indented: function () {
      isIndentedSyntax = true;
      return this;
    },

    fromFixtureDir: function (name) {
      dir = fixture(name);
      instance = SassGraph.parseDir(path.dirname(dir(indexFile())), opts);
      return this;
    },

    fromFixtureFile: function (name) {
      dir = fixture(name);
      instance = SassGraph.parseFile(dir(indexFile()), opts);
      return this;
    },

    assertDecendents: function (expected) {
      var actual = [];

      instance.visitDescendents(dir(indexFile()), function (imp) {
        actual.push(imp);
      });

      assert.deepEqual(expected.map(dir), actual);
      return this;
    },

    assertAncestors: function (file, expected) {
      const actual = new Set();

      instance.visitAncestors(dir(file), (imp) => {
        actual.add(imp);
      });

      assert.deepEqual(new Set(expected.map(dir)), actual);
      return this;
    },
  };
}
