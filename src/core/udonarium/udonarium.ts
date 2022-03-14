import { ObjectStore } from "./object-store";
import { RoomDataContext , PeerContext , PeerCursor, RoomControl, Round} from "../class/roomContext";
import { systemLog , errorLog } from "../../tools/logger";
import { ImageStorage } from "./image-storage";
import { AudioStorage } from "./audio-storage";
import { readRoomData ,writeRoomData } from "../db";

export class Udonarium {
  ObjectStore!:ObjectStore;
  imageStorage!:ImageStorage;
  audioStorage!:AudioStorage;
  room!:RoomDataContext;
  timeoutId!:NodeJS.Timer;
  peerCursorList:PeerContext = {};
  roomControl:RoomControl = new RoomControl();
  round:Round = new Round();

  constructor(room :RoomDataContext) {
    if (!this.dataCheck(room)) throw room;
    this.room = room;
    let admin = readRoomData(this.room.dbId,"RoomAdmin")
      .then(admin => {
        if (admin) this.roomControl = <RoomControl>admin;
      })
      .catch((error) => {
        throw error;
      });
    let round = readRoomData(this.room.dbId,"Round")
      .then(round => {
        if (round) this.round = <Round>round;
      })
      .catch((error) => {
        throw error;
      });
    Promise.all([admin,round])
    this.ObjectStore = new ObjectStore(room);
    this.imageStorage = new ImageStorage(room);
    this.audioStorage = new AudioStorage(room);
  }

  dataCheck(room :RoomDataContext):boolean {
    if (!room.dbId || !room.imageId || !room.audioId) return false;
    return true;
  }

  get peerCursors():PeerCursor[] {
    let peerCursors:PeerCursor[] = [];
    for (let peerId of Object.keys(this.peerCursorList)) {
      peerCursors.push(this.peerCursorList[peerId]);
    }
    return peerCursors;
  }

  addPeer(cursor :PeerCursor) {
    this.peerCursorList[cursor.peerId] = cursor;
  }

  removePeer(peerId :string) {
    delete this.peerCursorList[peerId];
  }

  async setRoomAdmin(object :RoomControl):Promise<void> {
    this.roomControl = object;
    await writeRoomData(this.room.dbId,"RoomAdmin",object)
    return;
  }
  readRoomAdmin():RoomControl {
    return this.roomControl;
  }

  async setRound(object :Round):Promise<void> {
    this.round = object;
    await writeRoomData(this.room.dbId,"Round",object)
    return;
  }
  readRound():Round {
    return this.round;
  }

  close() {
    this.ObjectStore.close();
    this.imageStorage.close();
    this.audioStorage.close();
  }
}
