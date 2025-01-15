export interface SassGraphOptions {
  extensions: string[];
  exclude: RegExp | null;
  follow: boolean;
  loadPaths: string[];
  resolver?: (importPath: string) => string | false;
}

export interface SassGraphIndexEntry {
  imports: string[];
  importedBy: string[];
  modified: Date;
}
