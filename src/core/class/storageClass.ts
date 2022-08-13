
export abstract class StorageClass {
  constructor(storageType :string = '') {
  }
  
  abstract accessTest():boolean;

  abstract dirCreate(storageId :string):string;

  abstract fileCreate(storageId :string, fileName :string, fileData :ArrayBuffer):Promise<string>;

  abstract dirRemove(storageId :string):boolean;

  abstract fileRemove(storageId :string, fileName :string):Promise<boolean>;
}

