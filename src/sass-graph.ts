import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parseImports } from './parse-imports.js';
import type { SassGraphIndexEntry, SassGraphOptions } from './types.js';

// Resolve a SASS module to a path
function resolveSassPath(
  sassPath: string,
  loadPaths: string[],
  extensions: string[],
): string | false {
  const re = new RegExp(`(.(${extensions.join('|')}))$`, 'i');
  const sassPathName = sassPath.replace(re, '');
  for (const loadPath of loadPaths) {
    for (const ext of extensions) {
      const scssPath = path.normalize(`${loadPath}/${sassPathName}.${ext}`);
      try {
        if (fs.lstatSync(scssPath).isFile()) return scssPath;
      } catch {}
      // Special case for partials
      const partialPath = path.join(path.dirname(scssPath), `_${path.basename(scssPath)}`);
      try {
        if (fs.lstatSync(partialPath).isFile()) return partialPath;
      } catch {}
    }
  }
  return false;
}

export class SassGraph {
  public dir: string | undefined;
  public extensions: string[];
  public exclude: RegExp | null;
  public follow: boolean;
  public loadPaths: string[];
  public customResolver: ((importPath: string) => string | false) | undefined;

  public index: Record<string, SassGraphIndexEntry> = {};

  static parseFile(filepath: string, options: Partial<SassGraphOptions>): SassGraph {
    if (!fs.lstatSync(filepath).isFile()) throw new Error(`Invalid file path: ${filepath}`);

    const fullOpts = processOptions(options),
      graph = new SassGraph(fullOpts);

    graph.addFile(path.resolve(filepath));

    return graph;
  }

  static parseDir(dirpath: string, options: Partial<SassGraphOptions>): SassGraph {
    if (!fs.lstatSync(dirpath).isDirectory()) throw new Error(`Invalid directory path: ${dirpath}`);

    const fullOpts = processOptions(options),
      resolvedDirPath = path.resolve(dirpath);
    return new SassGraph(fullOpts, resolvedDirPath);
  }

  constructor(options: SassGraphOptions, dir?: string) {
    this.dir = dir;
    this.extensions = options.extensions;
    this.exclude = options.exclude;
    this.follow = options.follow;
    this.loadPaths = (options.loadPaths || []).map((p) => path.resolve(p));
    this.customResolver = options.resolver;

    if (dir) {
      const files = fg.sync(
        this.extensions.map((ext) => path.join(dir, `/**/*.${ext}`)),
        {
          dot: true,
          onlyFiles: true,
          followSymbolicLinks: this.follow,
        },
      );
      for (const file of files) {
        try {
          this.addFile(path.resolve(file));
        } catch {}
      }
    }
  }

  addFile(filepath: string, parent?: string): void {
    if (this.exclude?.test(filepath)) return;

    const entry = (this.index[filepath] = this.index[filepath] || {
      imports: [],
      importedBy: [],
      modified: fs.statSync(filepath).mtime,
    });

    const isIndentedSyntax = path.extname(filepath) === '.sass',
      imports = parseImports(fs.readFileSync(filepath, 'utf-8'), isIndentedSyntax),
      cwd = path.dirname(filepath);

    for (const importPath of imports) {
      const loadPaths = [cwd, this.dir, ...this.loadPaths]
        .filter((p): p is string => !!p)
        .filter((item, index, self) => self.indexOf(item) === index);

      let resolved: string | false = false;
      if (this.customResolver) resolved = this.customResolver(importPath);
      if (!resolved) resolved = resolveSassPath(importPath, loadPaths, this.extensions);

      if (!resolved || this.exclude?.test(resolved)) continue;

      if (!entry.imports.includes(resolved)) {
        entry.imports.push(resolved);
        this.addFile(fs.realpathSync(resolved), filepath);
      }
    }

    if (parent) {
      const resolvedParent = this.loadPaths.find((p) => parent.includes(p))
        ? parent.substring(parent.indexOf(this.loadPaths.find((p) => parent.includes(p))!))
        : parent;

      if (!this.exclude?.test(resolvedParent)) {
        entry.importedBy.push(resolvedParent);
      }
    }
  }

  visitAncestors(
    filepath: string,
    callback: (filepath: string, node: SassGraphIndexEntry) => void,
  ): void {
    this.visit(filepath, callback, (node) => node?.importedBy || []);
  }
  visitDescendents(
    filepath: string,
    callback: (filepath: string, node: SassGraphIndexEntry) => void,
  ): void {
    this.visit(filepath, callback, (node) => node?.imports || []);
  }

  private visit(
    filepath: string,
    callback: (filepath: string, node: SassGraphIndexEntry) => void,
    edgeCallback: (node: SassGraphIndexEntry | null) => string[],
    visited: Set<string> = new Set(),
  ): void {
    const realPath = fs.realpathSync(filepath);
    if (!this.index[realPath]) return;

    const edges = edgeCallback(this.index[realPath]);
    for (const edge of edges) {
      if (!visited.has(edge)) {
        visited.add(edge);
        callback(edge, this.index[edge]);
        this.visit(edge, callback, edgeCallback, visited);
      }
    }
  }
}

function processOptions(options: Partial<SassGraphOptions>): SassGraphOptions {
  return {
    loadPaths: [process.cwd()],
    extensions: ['scss', 'sass'],
    exclude: null,
    follow: false,
    ...options,
  };
}
