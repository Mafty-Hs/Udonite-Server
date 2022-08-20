import fs from 'fs';
import { StorageClass } from '../../class/storageClass';
import { systemLog , errorLog } from "../../../tools/logger";

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
  
  accessTest():Promise<boolean>  { 
    let result = false;
    let imagePath = <string>process.env.imageDataPath + '/' + "access.txt";
    let audioPath = <string>process.env.audioDataPath + '/' + "access.txt";
    try{
      fs.writeFileSync( imagePath, "test");
      fs.writeFileSync( audioPath, "test");
      fs.rmSync(imagePath, { force: true });
      fs.rmSync(audioPath, { force: true });
      result = true;
    }
    catch(e){
      systemLog('LocalStorage access error','',e)
    }
    return new Promise<boolean>((resolve,reject) => {
      resolve(result);
    })
  }

  dirCreate(storageId :string):Promise<string>  {
    let path = this.basePath + '/' + storageId;
    return new Promise<string>((resolve,reject) => {
      if ( fs.existsSync( path )) resolve('');
      fs.mkdirSync(path);
      resolve(path);
    })
  }

  fileCreate(storageId :string, fileName :string, mimeType :string,fileData :ArrayBuffer):Promise<string> {
    let filePath =  this.basePath + '/' + storageId + '/' + fileName;
    let writeStream = fs.createWriteStream(filePath);
    return new Promise<string>((resolve,reject) => {
        writeStream.write(fileData,'binary');
        writeStream.end(resolve);
        resolve(filePath);
    })
  }

  dirRemove(storageId :string):Promise<boolean> {
    let path = this.basePath + '/' + storageId;
    return new Promise<boolean>((resolve,reject) => {
      if ( !fs.existsSync( path )) resolve(false);
      fs.rmSync(path, { recursive: true, force: true });
      resolve(true);
    })
  }

  fileRemove(storageId :string, fileName :string):Promise<boolean> {
    let filePath = this.basePath + '/' + storageId + '/' + fileName;
    return new Promise<boolean>((resolve,reject) => {
      if ( !fs.existsSync( filePath )) resolve(false);
      fs.rmSync(filePath, { force: true });
      resolve(true);
    })
  }
  
}

