
export class ObjectContext {
  aliasName: string = '';
  identifier: string = '';
  majorVersion: number = 0;
  minorVersion: number = 0;
  parentIdentifier: string = '';
  context!: ObjectClientContext;
}

export interface ObjectClientContext {
  aliasName: string;
  identifier: string;
  majorVersion: number;
  minorVersion: number;
  syncData:object
}

export type CatalogItem = { identifier: string, version: number };


