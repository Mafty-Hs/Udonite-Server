import fs from 'fs';
import { StorageClass } from '../../class/storageClass';

export class LocalStorage extends StorageClass {
  constructor(storageType :string = '') {
    super(storageType);
    switch(storageType) {
      case 'image':
        this.basePath = <string>process.env.imageDataPath;
        break;
      case 'audio':
        this.basePath = <string>process.env.audioDataPath
        break;
      default:
        throw 'need set DataType';
    }
  }
  
  basePath:string = '' ;
  
  accessTest():boolean { 
    let imagePath = <string>process.env.imageDataPath + '/' + "access.txt";
    let audioPath = <string>process.env.audioDataPath + '/' + "access.txt";
    try{
      fs.writeFileSync( imagePath, "test");
      fs.writeFileSync( audioPath, "test");
      fs.rmSync(imagePath, { force: true });
      fs.rmSync(audioPath, { force: true });
    }
    catch(e){
      return false;
    }
    return true;
  }

  dirCreate(storageId :string):string {
    let path = this.basePath + '/' + storageId;
    if ( fs.existsSync( path )) return '';
    fs.mkdirSync(path);
    return path;
  }

  fileCreate(storageId :string, fileName :string, fileData :ArrayBuffer):Promise<string> {
    let filePath =  this.basePath + '/' + storageId + '/' + fileName;
    let writeStream = fs.createWriteStream(filePath);
    return new Promise<string>((resolve,reject) => {
        writeStream.write(fileData,'binary');
        writeStream.end(resolve);
    })
  }

  dirRemove(storageId :string):boolean {
    let path = this.basePath + '/' + storageId;
    if ( !fs.existsSync( path )) return false;
    fs.rmSync(path, { recursive: true, force: true });
    return true;
  }

  fileRemove(storageId :string, fileName :string):Promise<boolean> {
    let filePath = this.basePath + '/' + storageId + '/' + fileName;
    if ( !fs.existsSync( filePath )) new Promise<boolean>((resolve,reject) => {
      return false;
    })
    fs.rmSync(filePath, { force: true });
    return new Promise<boolean>((resolve,reject) => {
      return true;
    })
  }
}

