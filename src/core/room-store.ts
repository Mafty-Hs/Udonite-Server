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
      roomNo: room.roomNo,
      roomId: roomId,
      roomName: room.roomName,
      lastAccess: Date.now(),
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

  dateUpdate(roomId :string):void {
    if (!this._roomStore[roomId]) return;
    this._roomStore[roomId].lastAccess = Math.floor(Date.now() / 1000);
    this.save();
  }

  update(roomId :string ,roomName? :string ,password? :string ):void {
    if (this._roomStore[roomId]) {
      if (roomName) this._roomStore[roomId].roomName = roomName;
      this._roomStore[roomId].password = String(password);
      this.dateUpdate(roomId);
    }
  }

  read(roomId :string):RoomDataContext {
    return this._roomStore[roomId];
  } 
 
  remove(roomId :string):void {
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
          roomNo: room.roomNo,
          roomId: roomId,
          roomName: room.roomName,
          lastAccess: room.lastAccess,
          password: room.password,
          isOpen: room.isOpen,
          is2d: room.is2d
        } 
      });
    }
    return [];
  }  

  private load():void {
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

  private async save():Promise<void> {
    if (this.timerId) clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {this.dataWrite()},1000);
  }

  private async dataWrite():Promise<void> {
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
