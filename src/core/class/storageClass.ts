
export abstract class StorageClass {
  constructor(storageType :string = '') {
  }
  
  abstract accessTest():Promise<boolean>;

  abstract dirCreate(storageId :string):Promise<string>;

  abstract fileCreate(storageId :string, fileName :string,mimeType :string,fileData :ArrayBuffer):Promise<string>;

  abstract dirRemove(storageId :string):Promise<boolean>;

  abstract fileRemove(storageId :string, fileName :string):Promise<boolean>;
}

