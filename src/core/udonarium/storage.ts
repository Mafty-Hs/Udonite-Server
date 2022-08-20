import { StorageClass } from '../class/storageClass';
import { LocalStorage } from './storage/local-storage';
import { ObjectStorage } from './storage/object-storage';

export class storage extends StorageClass {
  constructor(storageType :string = '') {
    super(storageType);
    switch(<string>process.env.storageType) {
      case 's3':
        this.storage = new ObjectStorage(storageType);
        break;
      case 'local':
      default:
        this.storage = new LocalStorage(storageType);
        break;
    }
  }

  private storage!:StorageClass;
   
  accessTest():Promise<boolean> { return this.storage.accessTest() }

  dirCreate(storageId :string):Promise<string> {
    if (!storageId) throw "invalid storageId";
    return this.storage.dirCreate(storageId);
  }

  fileCreate(storageId :string, fileName :string, mimeType :string, fileData :ArrayBuffer):Promise<string> {
    if (!storageId) throw "invalid storageId";
    if (!fileName || !fileData) throw "file is Null";
    return this.storage.fileCreate(storageId, fileName, mimeType,fileData);
  }

  dirRemove(storageId :string):Promise<boolean> {
    if (!storageId) throw "invalid storageId";
    return this.storage.dirRemove(storageId);
  }

  fileRemove(storageId :string, fileName :string):Promise<boolean> {
    if (!storageId) throw "invalid storageId";
    if (!fileName) throw "file is Null";
    return this.storage.fileRemove(storageId, fileName);
  }
}
