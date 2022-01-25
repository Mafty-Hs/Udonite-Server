import { Udonarium } from "core/udonarium/udonarium";

export interface RoomPeersContext {
  [roomId: string]: string[]
}

export interface RoomInstance {
  [roomId: string]: Udonarium
}

export class RoomContext {
  roomName: string = '';
  password: string = '';
  isOpen: boolean = true;
  is2d: boolean = false;
}

export interface RoomDataContext {
  roomName: string;
  dbId: string ;
  imageId: string;
  audioId: string;
  password: string;
  isOpen: boolean;
  is2d: boolean;
}

export class RoomListContext {
  roomName: string = '';
  roomId: string = ''
  password: string = '';
  isOpen: boolean = false;
  is2d: boolean = false;
  players: number = 0;
}

export interface PeerContext {
  [peerId: string]: PeerCursor
}

export interface PeerCursor {
  peerId :string;
  playerIdentifier :string;
} 
