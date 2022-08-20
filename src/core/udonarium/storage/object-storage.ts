import fs from 'fs';
import { S3Client , S3ClientConfig ,PutObjectCommand, GetObjectCommand,DeleteObjectCommand, PutObjectCommandInput, DeleteObjectCommandInput, ListObjectsCommand, ListObjectsCommandInput, _Object, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { StorageClass } from '../../class/storageClass';
import { systemLog , errorLog } from "../../../tools/logger";
import { type } from 'os';
import { MimeType } from 'tools/mime-type';

export class ObjectStorage extends StorageClass {
  constructor(storageType :string = '') {
    super(storageType);
    let configfile = './config/s3clientconfig.json';
    try {
      let file = fs.readFileSync(configfile, 'utf8')
      if (file) {
        let json = JSON.parse(file);
        let config = <S3ClientConfig>json
        this.s3client = new S3Client(config);
      }
    }
    catch (error) {
      errorLog('ObjectStorage Access Error','',error);
    }
    this.bucketName = <string>process.env.s3BucketName;
  } 

  s3client!:S3Client;

  bucketName:string = '';
  
  accessTest():Promise<boolean> { 
    return this._accessTest();
  }

  private async _accessTest():Promise<boolean>  {
    try {
      let output = await this.s3client.send(new ListObjectsV2Command({
        Bucket: this.bucketName
      }));
      return true;
    }
    catch (err) {
      errorLog('ObjectStorage Access Error','',err);
      return false
    }
  }

  dirCreate(storageId :string):Promise<string> {
    return this._dirCreate(storageId)
  }

  private async _dirCreate(storageId :string):Promise<string> {
    const objects = await this.getObjects(storageId);
    if (!objects) {
      return this.objectCreate(storageId,'text/plain','testfile.txt')
    }
    return storageId;
  }

  fileCreate(storageId :string, fileName :string,mimeType :string, fileData :ArrayBuffer):Promise<string> {   
    return this.objectCreate(storageId, fileName, mimeType , fileData);
  }

  private async objectCreate(storageId :string, fileName :string = '', mime:string  , fileData? :ArrayBuffer):Promise<string> {
    try {
      let input:PutObjectCommandInput;
      const filePath =  storageId + '/' + fileName;
      const file = fileData ? new Uint8Array(fileData) : 'testtext';
      input = {
        Bucket: this.bucketName,
        Key: filePath,
        ContentType: mime,
        Body: file
      }
      const output = await this.s3client.send(
        new PutObjectCommand(input)
      );
      return filePath;
    } catch (err) {
      errorLog('ObjectStorage Write Error','',err);
      return "error";
    }
  }

  dirRemove(storageId :string):Promise<boolean> {
    return this.directoryRemove(storageId)
  }

  private async directoryRemove(storageId :string):Promise<boolean> {
    try {
      const objects = await this.getObjects(storageId);
      if (!objects) return false;
      for (let s3object of objects) {
        const input:DeleteObjectCommandInput = {
          Bucket: this.bucketName,
          Key: s3object.Key
        }
        await this.s3client.send(
          new DeleteObjectCommand(input)
        );
      }
      return true;
    } catch (err) {
      errorLog('ObjectStorage Remove Error','',err);
      return false
    }
  }

  fileRemove(storageId :string, fileName :string):Promise<boolean> {
    return this.objectRemove(storageId,fileName)
  }

  private async objectRemove(storageId :string, fileName :string):Promise<boolean> {
    try {
      const filePath =  storageId + '/' + fileName;
      const input:DeleteObjectCommandInput = {
          Bucket: this.bucketName,
          Key: filePath,
        }
      const output = await this.s3client.send(
        new DeleteObjectCommand(input)
      );
      return true;
    } catch (err) {
      errorLog('ObjectStorage Remove Error','',err);
      return false
    }
  }

  private async getObjects(storageId :string = ''):Promise<_Object[]|undefined> {
    try {
      const input:ListObjectsCommandInput = storageId ?
        {
          Bucket: this.bucketName,
          Prefix: storageId
        } :
        {
          Bucket: this.bucketName,
        } ;
      const output = await this.s3client.send(
        new ListObjectsCommand(input)
      );
      return output.Contents 
    } catch (err) {
      throw(err);
    }

  }
}
