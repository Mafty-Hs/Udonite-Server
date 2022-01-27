import fs from 'fs';
import { randomUUID } from "crypto";
import { RoomContext, RoomDataContext } from "./class/roomContext";

interface RoomStoreData {
  [RoomId :string]:RoomDataContext
}

export class RoomStore {
  private _roomStore:RoomStoreData = {};
  private timerId!:NodeJS.Timer;
  private roomfile:string = "";

  constructor() {
    this.roomfile = './data/roomstore.json';
    if (fs.existsSync(this.roomfile)) {
      this.load(); 
    }
  }

  add(room :RoomContext):string {
    let roomId = randomUUID();
    this._roomStore[roomId] = {
      roomId: roomId,
      roomName: room.roomName,
      dbId: randomUUID(),
      imageId: randomUUID(),
      audioId: randomUUID(),
      password: room.password,
      isOpen: room.isOpen,
      is2d: room.is2d
    };
    this.save();
    return roomId;
  }

  read(roomId :string):RoomDataContext {
    return this._roomStore[roomId];
  } 
 
  remove(roomId :string) {
    if (this._roomStore[roomId]) {
      delete this._roomStore[roomId];
      this.save();
    }
  } 
 
  get list() {
    if (Object.keys(this._roomStore).length > 0) {
      return Object.keys(this._roomStore).map( roomId => {
        let room = this._roomStore[roomId]
        return  {
          roomId: roomId,
          roomName: room.roomName,
          password: room.password,
          isOpen: room.isOpen,
          is2d: room.is2d
        } 
      });
    }
    return [];
  }  

  private load() {
    try {
      let file = fs.readFileSync(this.roomfile, 'utf8')
      if (file) {
        let json = JSON.parse(file);
        this._roomStore = <RoomStoreData>json;
      }
    }
    catch (error) {
      throw error
    }
    return;
  }

  private async save() {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {this.dataWrite()},1000);
  }

  private async dataWrite() {
    let data:string = ' ';
    //if (this._roomStore && Object.keys(this._roomStore).length > 0) 
     data = JSON.stringify(this._roomStore);
    try {
      await fs.writeFileSync(this.roomfile, data);
    } 
     catch (error) {
      throw error
    }
  }
}
