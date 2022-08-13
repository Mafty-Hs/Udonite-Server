import { StorageClass } from '../class/storageClass';
import { LocalStorage } from './storage/local-storage';

export class storage extends StorageClass {
  constructor(storageType :string = '') {
    super(storageType);
    this.storage = new LocalStorage(storageType);
    
  }

  private storage!:StorageClass;
   
  accessTest():boolean { return this.storage.accessTest() }

  dirCreate(storageId :string):string {
    if (!storageId) throw "invalid storageId";
    return this.storage.dirCreate(storageId);
  }

  fileCreate(storageId :string, fileName :string, fileData :ArrayBuffer):Promise<string> {
    if (!storageId) throw "invalid storageId";
    if (!fileName || !fileData) throw "file is Null";
    return this.storage.fileCreate(storageId, fileName, fileData);
  }

  dirRemove(storageId :string):boolean {
    if (!storageId) throw "invalid storageId";
    return this.storage.dirRemove(storageId);
  }

  fileRemove(storageId :string, fileName :string):Promise<boolean> {
    if (!storageId) throw "invalid storageId";
    if (!fileName) throw "file is Null";
    return this.storage.fileRemove(storageId, fileName);
  }
}
