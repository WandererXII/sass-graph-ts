export interface SassGraphOptions {
  extensions: string[];
  exclude: RegExp | null;
  follow: boolean;
  loadPaths: string[];
}

export interface SassGraphIndexEntry {
  imports: string[];
  importedBy: string[];
  modified: Date;
}
