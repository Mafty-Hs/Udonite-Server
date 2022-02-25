import { Collection, MongoClient, Document, WithId,ObjectId } from "mongodb";
import { RoomDataContext } from "../class/roomContext";
import { systemLog , errorLog } from "../../tools/logger";
import { ImageContext , ThumbnailContext} from "../class/imageContext";
import { fileRemove } from "./storage";
import fs from 'fs';
import sharp from "sharp";

export class ImageStorage {
  client!:MongoClient;
  imageStorage!:Collection;
  room!:RoomDataContext;
  ImageMap!:Map<string,ImageContext>;
  imagePath!:string;
  imageUrl!:string;

  constructor(room :RoomDataContext) {
    this.room = room;
    this.DBInit(room.dbId ,room.imageId).then(() => {return;})
  }

  private async DBInit(dbId :string ,imageId :string) {
    let MongoUri = <string>process.env.db ;
    this.imagePath = <string>process.env.imageDataPath + imageId;
    this.imageUrl = <string>process.env.imageUrlPath  + imageId;
    try {
      if ( !fs.existsSync( this.imagePath )) fs.mkdirSync(this.imagePath);
      if ( !fs.existsSync( this.imagePath + "/thumb" )) fs.mkdirSync(this.imagePath + "/thumb");
      this.client = await new MongoClient(MongoUri).connect();
      this.imageStorage = this.client.db(dbId).collection('ImageStorage');
      await this.load();
    }
    catch(error) {
      errorLog("Room Init Failed",this.room.roomId,error);
    }
  }

  async create(fileBuffer :ArrayBuffer ,type :string ,hash :string ,filesize :string ,owner :string):Promise<ImageContext|void> {
    if (!fileBuffer || this.ImageMap.get(hash)) return;
    let imageContext!:ImageContext;
    try {
      let url = await this.upload(fileBuffer,type,hash)
       let thumbnail = await this.thumbnail(type,hash);
      let thumbnailContext:ThumbnailContext = {
        type:type,
        url: thumbnail
      };
      imageContext = {
        identifier: hash ,
        type: type,
        url: url,
        thumbnail: thumbnailContext,
        filesize: Number(filesize),
        isHide: (owner === "SYSTEM"),
        owner: [owner],
        tag: []
      };
      let newDocument:Document =  {
        identifier: hash ,
        type: type,
        url: url,
        thumbnail: thumbnailContext,
        filesize: Number(filesize),
        isHide: (owner === "SYSTEM"),
        owner: [owner],
        tag: []
      };
      await this.imageStorage.insertOne(newDocument);
      this.ImageMap.set(imageContext.identifier, imageContext);
    } 
    catch(error) {
      errorLog("Image Create Error",this.room.roomId,error);
    }
    return imageContext;
  }

  async update(context :ImageContext):Promise<ImageContext> {
    try {
      await this.imageStorage.replaceOne({identifier: context.identifier},context)
      this.ImageMap.set(context.identifier, context);
    }
    catch(error) {
      errorLog("Image Update Error",this.room.roomId,error);
    }
    return context;
  }

  async getMap():Promise<ImageContext[]> {
    if (!this.ImageMap) {
      await this.waitLoad()
    }
    let imageMap :ImageContext[] = [];
    for (let context of this.ImageMap.values()) {
      imageMap.push(context);
    }
    return imageMap;
  }

  async remove(identifier:string):Promise<void> {
    if (!this.ImageMap.has(identifier)) return;
    let url = <string>this.ImageMap.get(identifier)?.url
    let filepath = this.imagePath + "/" + url.substring(this.imageUrl.length + 1)
    fileRemove(filepath);
    this.ImageMap.delete(identifier); 
    this.imageStorage.deleteOne({identifier: identifier});
  }

  async waitLoad() {
    if (this.ImageMap) return;
    systemLog("imageMap now loading! wait" ,this.room.roomId);
    while (!this.ImageMap) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    systemLog("imageMap wait end" ,this.room.roomId);
    return;
  }

  private async upload(file :ArrayBuffer, type :string, hash :string) {
    let filename = hash + '.' + type.substring(type.indexOf('/') + 1)
    let writePath = this.imagePath + "/" + filename;
    try {
      let writeStream = fs.createWriteStream(writePath);
      await new Promise<void>((resolve,reject) => {
        writeStream.write(file,'binary');
        writeStream.end(resolve);
      })  
    }
    catch(error) {
      errorLog("image write error",this.room.roomId,error)
      return "";
    }
    return this.imageUrl + "/" + filename;
  }

  private async thumbnail(type :string, hash :string) {
    let filename = hash + '.' + type.substring(type.indexOf('/') + 1)
    let thumbnail = await sharp(this.imagePath + "/" + filename)
      .resize({
        width: 128,
        height: 128,
        fit: "outside"
      })
      .toBuffer();
    let writePath = this.imagePath + "/thumb/" + filename;
    let writeStream = fs.createWriteStream(writePath);
    await new Promise<void>((resolve,reject) => {
      writeStream.write(thumbnail,'binary');
      writeStream.end(resolve);
    })  
    return  this.imageUrl + "/" + "thumb/" + filename;
  }

  async load() {
    let tempMap = new Map<string,ImageContext>();
    systemLog("imageMap load start" ,this.room.roomId);
    try {
      let alldocument = await this.imageStorage.find().toArray();
      for (let document of alldocument) {
        let doc = document as Document;
        let context:ImageContext = {
          identifier: doc.identifier,
          type: doc.type,
          url: doc.url,
          thumbnail: doc.thumbnail,
          filesize: doc.filesize,
          owner: doc.owner,
          isHide: doc.isHide,
          tag: doc.tag 
        }
        tempMap.set(context.identifier, context);
      }
    }
    catch(error) {
      errorLog("imageMap load error" , this.room.roomId,error);
    }
    systemLog("imageMap load end" ,this.room.roomId);
    this.ImageMap = tempMap;
    return;
  }

  close() {
    this.client.close;
  }

}
