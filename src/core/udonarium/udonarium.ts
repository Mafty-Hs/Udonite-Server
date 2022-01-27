import { ObjectStore } from "./object-store";
import { RoomDataContext , PeerContext , PeerCursor} from "../class/roomContext";
import { systemLog , errorLog } from "../../tools/logger";
import { ImageStorage } from "./image-storage";
import { AudioStorage } from "./audio-storage";

export class Udonarium {
  ObjectStore!:ObjectStore;
  imageStorage!:ImageStorage;
  audioStorage!:AudioStorage;
  room!:RoomDataContext;
  timeoutId!:NodeJS.Timer;
  peerCursorList:PeerContext = {};

  constructor(room :RoomDataContext) {
    if (!this.dataCheck(room)) throw room;
    this.room = room;
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


  close() {
    this.ObjectStore.close;
    this.imageStorage.close;
    this.audioStorage.close;
  }
}
