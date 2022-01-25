import { Collection, MongoClient, Document, WithId,ObjectId } from "mongodb";
import { RoomDataContext } from "../class/roomContext";
import { logger,debug } from "../logger";
import { ImageContext , ThumbnailContext} from "../class/imageContext";
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
      logger("Room Init Failed", error);
      logger("DB",error);
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
        owner: owner,
        tag: []
      };
      await this.imageStorage.insertOne(imageContext);
      this.ImageMap.set(imageContext.identifier, imageContext);
    } 
    catch(error) {
      logger("Image Create Error",error);
    }
    return imageContext;
  }

  async update(context :ImageContext):Promise<ImageContext> {
    try {
      await this.imageStorage.replaceOne({identifier: context.identifier},context)
      this.ImageMap.set(context.identifier, context);
    }
    catch(error) {
      logger("Image Update Error",error);
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

  async waitLoad() {
    if (this.ImageMap) return;
    logger("imageMap now loading! wait" ,this.room.roomName);
    while (!this.ImageMap) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    logger("imageMap wait end" ,this.room.roomName);
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
      logger("image write error",error)
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
    logger("imageMap load start" ,this.room.roomName);
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
      logger("imageMap load error" ,error);
    }
    logger("imageMap load end" ,this.room.roomName);
    this.ImageMap = tempMap;
    return;
  }

  close() {
    this.client.close;
  }

}
