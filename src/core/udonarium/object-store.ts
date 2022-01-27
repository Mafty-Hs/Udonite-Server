import { Collection, MongoClient, Document, WithId,ObjectId } from "mongodb";
import { RoomDataContext } from "../class/roomContext";
import { ObjectContext,CatalogItem} from "../class/objectContext";
import { systemLog , errorLog } from "../../tools/logger";

export class ObjectStore {
  client!:MongoClient;
  ObjectStore!:Collection;
  room!:RoomDataContext;
  ObjectMap = new Map<string,CatalogItem>();
  reflesh:boolean = false;
  shoudReflesh:boolean = true;

  constructor(room :RoomDataContext) {
    this.room = room;
    this.DBInit(room.dbId).then(() => {return;})
  }

  private async DBInit(dbId :string) {
    let MongoUri:string = process.env.db as string;
    try {
      this.client = await new MongoClient(MongoUri).connect();
      this.ObjectStore = this.client.db(dbId).collection('ObjectStore');
      let num = await this.ObjectStore.countDocuments();
      await this.refreshMap();
    }
    catch(error) {
      errorLog("ObjectStore Init Failed",this.room.roomId, error);
    }
  }

  async get(objectIdentifier :string):Promise<ObjectContext|null> {
    let document;
      try {
      document = await this.ObjectStore.findOne({identifier:  objectIdentifier});
      if (document) {
        return  this.documentToContext(document);
      }
      else if (this.ObjectMap.get(objectIdentifier)) this.ObjectMap.delete(objectIdentifier)

    }
    catch(error) {
      errorLog("ObjectStore get Failed",this.room.roomId, error);
    }
    return null;
  }

  async refreshMap() {
    systemLog("ObjectMap Reflesh",this.room.roomId);
    try {
      if (!this.ObjectStore) {
        await this.waitLoad();
      }
      let allDocument = await this.ObjectStore.find().toArray();
      let tempMap = new Map<string,CatalogItem>();
      for ( let document of allDocument) {
        let context = this.documentToContext(document);
        tempMap.set(context.identifier,
        {identifier: context.identifier ,version: context.majorVersion + context.minorVersion})
      }
      this.ObjectMap = tempMap;
      this.reflesh = false;
    }
    catch(error) {
      errorLog("ObjectMap reflesh Failed",this.room.roomId, error);
    }
  }

  async getCatalog():Promise<CatalogItem[]>{
    if (this.shoudReflesh) {
      this.reflesh = true;
      this.shoudReflesh = false;
      await this.refreshMap()
    }
    let catalog: CatalogItem[] = [];
    for (let object of this.ObjectMap.values()) {
      catalog.push({ identifier: object.identifier, version: object.version });
    }
    return catalog;
  }
  
  async update(objectIdentifier :string , context :ObjectContext):Promise<boolean> {
    let document:WithId<Document>|null = null;
    try {
      document = await this.ObjectStore.findOne({identifier:  objectIdentifier});
    }
    catch(error) {
      errorLog("Object verify Failed",this.room.roomId, error);
      errorLog("Object",this.room.roomId, context);
    }
    if (document) {
      if (context.majorVersion + context.minorVersion < (<Document>document).majorVersion + (<Document>document).minorVersion  ) {
        return false;
      }
      try {
        await this.ObjectStore.replaceOne(document,context);
        this.ObjectMap.set(objectIdentifier,{identifier: objectIdentifier ,version: context.majorVersion + context.minorVersion});
      }
      catch(error) {
        errorLog("Object update Failed",this.room.roomId, error);
        errorLog("Object",this.room.roomId, context);
      }
    }
    else {
      try {
        await this.ObjectStore.insertOne(context);
        this.ObjectMap.set(objectIdentifier,{identifier: objectIdentifier ,version: context.majorVersion + context.minorVersion});
      }
      catch(error) {
        errorLog("Object create Failed",this.room.roomId, error);
        errorLog("Object",this.room.roomId, context);
      }
    }
    if (!this.reflesh)this.shoudReflesh = true;
    return true;
  }

  async delete(objectIdentifier :string):Promise<void> {
    if (!this.ObjectMap.get(objectIdentifier)) return;
    try {
      await this.ObjectStore.deleteOne({identifier: objectIdentifier});
      this.ObjectMap.delete(objectIdentifier);
    }
    catch(error) {
      errorLog("Object Delete Failed",this.room.roomId, error);
      errorLog("Object",this.room.roomId, objectIdentifier);
    }
  }

  async allData():Promise<ObjectContext[]> {
    let result:ObjectContext[] = [];
    try {
      let allDocuments = await this.ObjectStore.find().toArray();
      for ( let document of allDocuments) {
        result.push(this.documentToContext(document));
      }
    }
    catch(error) {
      errorLog("AllObject Get Failed",this.room.roomId, error);
    }
    return result;
  }

  close() {
    this.client.close;
  }

  async waitLoad() {
    if (this.ObjectStore) return;
    while(!this.ObjectStore) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return;
  }

  documentToContext(document :WithId<Document>):ObjectContext {
    let doc = <Document>document
    let object:ObjectContext;
    try {
      object = { 
        aliasName: doc.aliasName,
        identifier: doc.identifier,
        majorVersion: doc.majorVersion,
        minorVersion: doc.minorVersion,
        parentIdentifier: doc.parentIdentifier,
        context: doc.context
      }
    }
    catch {
      object = { 
        aliasName: "",
        identifier: "",
        majorVersion: 0,
        minorVersion: 0,
        parentIdentifier: "",
        context: {
          aliasName: "",
          identifier: "",
          majorVersion: 0,
          minorVersion: 0,
          syncData: {}
        }
      }
      errorLog("Document Cast Failed",this.room.roomId, doc);
    }
    return object;
  }
}
