import { RoomContext,RoomInstance } from "./class/roomContext";
import { RoomStore } from "./room-store"
import { Udonarium } from "./udonarium/udonarium";
import { DBcreate , DBdrop } from "./db";
import { systemLog , errorLog } from "../tools/logger";
import { storage } from "./udonarium/storage";

export class Room {

  imageStorage = new storage('image');
  audioStorage = new storage('audio');
  
  constructer() {
  }

  roomStore:RoomStore = new RoomStore();
  roomInstance:RoomInstance = {};

  isRoomExist(roomId :string):boolean {
    return Boolean(this.roomStore.read(roomId));
  }

  room(roomId :string):Udonarium {
    if (this.roomInstance[roomId]) return this.roomInstance[roomId];
    let room =  this.roomStore.read(roomId);
    if (!room) throw "no room data";
    let instance = new Udonarium(room);
    if (!instance) throw "room wake up failed";
    this.roomInstance[roomId] = instance;
    systemLog("room wake up",roomId); 
    return instance;
  }
 
  async create(roomdata :RoomContext):Promise<string> {
    let roomId = this.roomStore.add(roomdata);
    let room = this.roomStore.read(roomId)
    await DBcreate(room.dbId);
    systemLog("room create",roomId,roomdata);
    return roomId;
  }

  sleep(roomId :string) {
    if (!this.roomInstance[roomId]) return;
    this.roomInstance[roomId].timeoutId = setTimeout(()=> {this.close(roomId)}, 30000);
  }

  close(roomId :string) {
    this.roomInstance[roomId].close();
    delete this.roomInstance[roomId];
    systemLog("room sleep",roomId);
  }

  async remove(roomId :string) {
    if (this.roomInstance[roomId]) return;
    let room = this.roomStore.read(roomId);
    if (room.imageId) this.imageStorage.dirRemove(room.imageId);
    if (room.audioId) this.imageStorage.dirRemove(room.audioId);
    DBdrop(room.dbId);
    this.roomStore.remove(roomId);
    systemLog("room remove",roomId);
  }


}
