import { Collection, MongoClient, Document } from "mongodb";
import { RoomDataContext } from "../class/roomContext";
import { systemLog , errorLog } from "../../tools/logger";
import { AudioContext, AudioUpdateContext } from "../class/audioContext";
import { dirRemove, fileRemove } from "./storage";
import fs from 'fs';
import { MimeType } from "../../tools/mime-type";

export class AudioStorage {
  client!:MongoClient;
  audioStorage!:Collection;
  room!:RoomDataContext;
  audioMap!:Map<string,AudioContext>;
  audioDBMap:string[] = [];
  audioPath!:string;
  audioUrl!:string;

  constructor(room :RoomDataContext) {
    this.room = room;
    this.DBInit(room.dbId ,room.audioId).then(() => {return;})
  }

  private async DBInit(dbId :string ,audioId :string) {
    let MongoUri = <string>process.env.db ;
    this.audioPath = <string>process.env.audioDataPath + audioId;
    this.audioUrl = <string>process.env.audioUrlPath  + audioId;
    try {
      if ( !fs.existsSync( this.audioPath )) fs.mkdirSync(this.audioPath);
      this.client = await new MongoClient(MongoUri).connect()
      this.audioStorage = this.client.db(dbId).collection('AudioStorage');
      this.load();
    }
    catch(error) {
      errorLog("Room Init Failed",this.room.roomId, error);
    }
  }

  async create(fileBuffer :ArrayBuffer ,name :string ,type :string ,hash :string ,filesize :string ,owner :string):Promise<AudioContext|void> {
    if (!fileBuffer || this.audioMap.get(hash)) return;
    let audioContext!:AudioContext;
    let url:string = ""
    try {
      url = await this.upload(fileBuffer,type,hash)
    }
    catch(error) {
      errorLog("Audio Upload Failed",this.room.roomId ,error);
      return;
    }
    audioContext = {
      identifier: hash,
      name: name,
      type: type,
      url: url,
      filesize: Number(filesize),
      owner: owner,
      volume: 100,
      isHidden: false
    };
    this.audioMap.set(audioContext.identifier, audioContext);
    return audioContext;
  }

  async update(context :AudioContext):Promise<AudioUpdateContext> {
    let upsert: boolean = !this.audioMap.has(context.identifier)
    if (upsert || this.audioDBMap.includes(context.identifier)) {
      try {
        await this.audioStorage.replaceOne({identifier: context.identifier} ,context ,{upsert: true});
        this.audioDBMap.push(context.identifier);
        this.audioMap.set(context.identifier, context);
      }
      catch(error) {
        errorLog("Audio DB Update Error",this.room.roomId,error);
      }
    }
    else {
      this.audioMap.set(context.identifier, context);
    }
    return {context: context ,isUpsert: upsert};
  }

  async remove(identifier:string):Promise<void> {
    if (!this.audioMap.has(identifier)) return;
    if (this.audioDBMap.includes(identifier)) {
      this.audioDBMap = this.audioDBMap.filter(_identifier => _identifier != identifier);
      try {
        this.audioStorage.deleteOne({identifier: identifier});
      }
      catch(error) {
        errorLog("Audio DB delete Error",this.room.roomId,error);
      }
    }
    else {
      let url = <string>this.audioMap.get(identifier)?.url
      let filepath = this.audioPath + "/" + url.substring(this.audioUrl.length + 1)
      fileRemove(filepath);
    }
    this.audioMap.delete(identifier); 
  }

  async getMap():Promise<AudioContext[]> {
    if (!this.audioMap) {
      await this.waitLoad()
    }
    let audioMap :AudioContext[] = [];
    for (let context of this.audioMap.values()) {
      audioMap.push(context);
    }
    return audioMap;
  }

  async waitLoad() {
    if (this.audioMap) return;
    systemLog("audioMap now loading! wait" ,this.room.roomId);
    while (!this.audioMap) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    systemLog("audioMap wait end" ,this.room.roomId);
    return;
  }

  private async upload(file :ArrayBuffer, type :string, hash :string) {
    let ext = MimeType.extension(type);
    let filename = hash + '.' + ext;
    let writePath = this.audioPath + "/" + filename;
    try {
      let writeStream = fs.createWriteStream(writePath);
      await new Promise<void>((resolve,reject) => {
        writeStream.write(file,'binary');
        writeStream.end(resolve);
      })  
    }
    catch(error) {
      errorLog("audio write error",this.room.roomId,error)
      return "";
    }
    return this.audioUrl + "/" + filename;
  }

  async load() {
    systemLog("AudioMap load start" ,this.room.roomId);
    let audioMap = new Map<string,AudioContext>();
    for (let context of PresetSound) {
      audioMap.set(context.identifier, context)
    }
    try {
      let alldocument = await this.audioStorage.find().toArray();
      for (let document of alldocument) {
        let doc = document as Document;
        let context:AudioContext = {
          identifier: doc.identifier,
          name: doc.name,
          type: doc.type,
          url: doc.url,
          filesize: doc.filesize,
          owner: doc.owner,
          volume: doc.volume,
          isHidden: doc.isHidden,
        }
        this.audioDBMap.push(doc.identifier);
        audioMap.set(context.identifier, context);
      }
    }
    catch(error) {
      errorLog("AudioMap load error" , this.room.roomId,error);
    }
    this.audioMap = audioMap;
    systemLog("AudioMap load end" ,this.room.roomId);
    return;
  }

  close() {
    this.client.close();
    dirRemove(this.audioPath);
  }

}

const PresetSound:AudioContext[] = [
  { identifier: "dicePick", name: "dicePick" , type: ".mp3", url: './assets/sounds/soundeffect-lab/shoulder-touch1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "dicePut", name: "dicePut" , type: ".mp3", url: './assets/sounds/soundeffect-lab/book-stack1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "diceRoll1", name: "diceRoll1" , type: ".mp3", url: './assets/sounds/on-jin/spo_ge_saikoro_teburu01.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "diceRoll2", name: "diceRoll2" , type: ".mp3", url: './assets/sounds/on-jin/spo_ge_saikoro_teburu02.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "cardDraw", name: "cardDraw" , type: ".mp3", url: './assets/sounds/soundeffect-lab/card-turn-over1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "cardPick", name: "cardPick" , type: ".mp3", url: './assets/sounds/soundeffect-lab/shoulder-touch1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "cardPut", name: "cardPut" , type: ".mp3", url: './assets/sounds/soundeffect-lab/book-stack1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "cardShuffle", name: "cardShuffle" , type: ".mp3", url: './assets/sounds/soundeffect-lab/card-open1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "piecePick", name: "piecePick" , type: ".mp3", url: './assets/sounds/soundeffect-lab/shoulder-touch1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "piecePut", name: "piecePut" , type: ".mp3", url: './assets/sounds/soundeffect-lab/book-stack1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "blockPick", name: "blockPick" , type: ".wav", url: './assets/sounds/tm2/tm2_pon002.wav', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "blockPut", name: "blockPut" , type: ".wav", url: './assets/sounds/tm2/tm2_pon002.wav', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "lock", name: "lock" , type: ".wav", url: './assets/sounds/tm2/tm2_switch001.wav', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "unlock", name: "unlock" , type: ".wav", url: './assets/sounds/tm2/tm2_switch001.wav', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "sweep", name: "sweep" , type: ".wav", url: './assets/sounds/tm2/tm2_swing003.wav', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "puyon", name: "puyon" , type: ".mp3", url: './assets/sounds/soundeffect-lab/puyon1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "surprise", name: "surprise" , type: ".mp3", url: './assets/sounds/otologic/Onmtp-Surprise02-1.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "coinToss", name: "coinToss" , type: ".mp3", url: './assets/sounds/niconicomons/nc146227.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "alarm", name: "alarm" , type: ".mp3", url: './assets/sounds/alarm.mp3', filesize: 0, owner: 'SYSTEM', volume: 50, isHidden: true},
  { identifier: "pikon", name: "pikon" , type: ".mp3", url: './assets/sounds/soundeffect-lab/pikon.mp3', filesize: 0, owner: 'SYSTEM', volume: 100, isHidden: true}
];
