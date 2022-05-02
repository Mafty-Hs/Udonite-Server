import { MongoClient ,WithId ,Document} from "mongodb";
import { ImageContext, ThumbnailContext } from "./class/imageContext";
import { ObjectContext } from "./class/objectContext";
import { systemLog , errorLog } from "../tools/logger";

const sampleData:ObjectContext = {
  aliasName: "testdata",
  identifier: "testdata",
  majorVersion: 1,
  minorVersion: 0,
  syncData: {}
};
const systemThumnail:ThumbnailContext = {type: "" , url: ""}
const defaultImage:ImageContext[] = [
  { identifier: "none_icon" , type: "/.png", url: "./assets/images/ic_account_circle_black_24dp_2x.png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default","アイコン"] },
  { identifier: "stand_no_image" , type: "/.png", url: "./assets/images/nc96424.png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default","スタンド"] },
  { identifier: "testTableBackgroundImage_image" , type: "/.jpg", url: "./assets/images/BG10a_80.jpg", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default","テーブル"] },
  { identifier: "skelton" , type: "/.png", url: "./assets/images/skeleton.png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/tex.jpg" , type: "/.jpg", url: "./assets/images/tex.jpg", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/dice/2_coin/2_coin[表].png" , type: "/.png", url: "./assets/images/dice/2_coin/2_coin[1].png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/dice/2_coin/2_coin[裏].png" , type: "/.png", url: "./assets/images/dice/2_coin/2_coin[0].png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/trump/blank_card.png" , type: "/.png", url: "./assets/images/trump/blank_card.png", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/trump/z01.gif" , type: "/.gif", url: "./assets/images/trump/z01.gif", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] },
  { identifier: "./assets/images/trump/z02.gif" , type: "/.gif", url: "./assets/images/trump/z02.gif", thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] }
]


export async function DBinit() {
  let MongoUri = <string>process.env.db;
  systemLog("MongoDB connection test");
  if (!MongoUri) {
    throw "MongoDB config not Found";
    return
  }
  let client!:MongoClient;
  try {
    client = await MongoClient.connect(MongoUri);
    systemLog("MongoDB connection Successful");
  }
  catch(error) {
    errorLog("MongoDB connection Error");
    throw error;
  }
  finally {
    if (client) client.close();
  }
}

export async function DBcreate(dbId :string) {
  let MongoUri = <string>process.env.db;
  let client!:MongoClient;
  let defaultImage2:ImageContext[] = makeImageContext();
  try {
    client = await MongoClient.connect(MongoUri);
    const db = client.db(dbId);
    const objectStore = db.collection('ObjectStore');
    await objectStore.insertOne(sampleData);
    await objectStore.createIndex({identifier: 1},{unique: true},);
    const imageStorage = db.collection('ImageStorage');
    await imageStorage.insertMany(defaultImage);
    await imageStorage.insertMany(defaultImage2);
    await imageStorage.createIndex({identifier: 1},{unique: true},);
  }
  catch(error) {
    errorLog("MongoDB DB create Error",'',error);
  }
  finally {
    if (client) client.close();
  }
  return;
}

export async function DBdrop(dbId :string) {
  let MongoUri = <string>process.env.db;
  let client!:MongoClient;
  try {
    client = await MongoClient.connect(MongoUri);
    const db = client.db(dbId);
    await db.dropDatabase();
  }
  catch(error) {
    errorLog("MongoDB DB drop Error",'',error);
  }
  finally {
    if (client) client.close();
  }
  return;
}

export async function writeRoomData(dbId: string , identifier:string ,data: object):Promise<void> {
  let MongoUri = <string>process.env.db;
  let client!:MongoClient;
  try {
    client = await MongoClient.connect(MongoUri);
    const db = client.db(dbId);
    const room = db.collection('room');
    await room.replaceOne({identifier:  identifier},data,{upsert:true});
  }
  catch(error) {
    errorLog("MongoDB DB collection write Error",'',error);
  }
  finally {
    if (client) client.close();
  }
  return;
}

export async function readRoomData(dbId: string , identifier:string ):Promise<object|null> {
  let MongoUri = <string>process.env.db;
  let client!:MongoClient;
  let object!:object;
  try {
    client = await MongoClient.connect(MongoUri);
    const db = client.db(dbId);
    const room = db.collection('room');
    let document = await room.findOne({identifier:  identifier});
    if (document) {
      let {_id, ...newObject} = <Document>document
      object = <object>newObject;
    }
  }
  catch(error) {
    errorLog("MongoDB DB collection read Error",'',error);
  }
  finally {
    if (client) client.close();
  }
  if (object) {
    return object;
  }
  return null;
}


function makeImageContext():ImageContext[] {
  let output:ImageContext[] = [];
  let dice:string[] = ["4_dice","6_dice","6_dice_black","8_dice","10_dice","12_dice","20_dice"]
  for (let imagePathPrefix of dice) {
    let facenum = Number(imagePathPrefix.substring(0,imagePathPrefix.indexOf('_')));
    for (let face = 1; face < facenum + 1 ; face++){
      let url: string = `./assets/images/dice/${imagePathPrefix}/${imagePathPrefix}[${face}].png`;
      let context:ImageContext = 
      { identifier: url , type: "/.png", url: url, thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] };
      output.push(context);
    }
  }

  let imagePathPrefix:string = '100_dice';
  let faces:string[] = ['10','20','30','40','50','60','70','80','90','100'];
  for (let face of faces){
    let url: string = `./assets/images/dice/${imagePathPrefix}/${imagePathPrefix}[${face}].png`;
    let context:ImageContext = 
    { identifier: url , type: "/.png", url: url, thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] };
    output.push(context);
  }

  let suits: string[] = ['c', 'd', 'h', 's'];
  let trumps: string[] = [];
  for (let suit of suits) {
    for (let i = 1; i <= 13; i++) {
      trumps.push(suit + (('00' + i).slice(-2)));
    }
  }
  trumps.push('x01');
  trumps.push('x02');
  for (let trump of trumps) {
    let url: string = './assets/images/trump/' + trump + '.gif';
    let context:ImageContext = 
      { identifier: url , type: "/.gif", url: url, thumbnail: systemThumnail, filesize: 0, isHide: true, owner: ["SYSTEM"], tag: ["default"] };
      output.push(context);
  }
  return output;
}
