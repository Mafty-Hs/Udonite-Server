import { ConfigContext, ServerInfo } from "./core/class/system" 
import express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import { loadConfig } from "./core/loadConfig";
import { Room } from "./core/room";
import { RoomContext, RoomListContext, RoomPeersContext, PeerCursor } from "./core/class/roomContext";
import { DBinit } from "./core/db";
import { ObjectContext } from "./core/class/objectContext";
import { logger } from "./tools/logger";
import { ImageContext } from "./core/class/imageContext";
import { AudioContext } from "./core/class/audioContext";
import multer from 'multer';


class Server {
  config:ConfigContext;
  _express = express();
  httpd: http.Server = http.createServer(this._express);
  server!: socketio.Server;
  roomPeers:RoomPeersContext = {};
  room!:Room;
  timer!:NodeJS.Timer;
  ReverseRoomMap:Map<string, string> = new Map<string, string>();
  
  constructor() {
    this.config = loadConfig();
    this.server = new socketio.Server(this.httpd,
          {
      cors: {
        origin: this.config.url,
        methods: ["GET", "POST"],
        credentials: true }
       }
    );
    this.init()
  }

  async init() {
    process.on("exit", exitCode => {
      this.close();
      logger("Udonite Shutdown");
    });
    process.on("SIGINT", ()=>process.exit(0));
    try {
      this.fileReciever();
      await DBinit();
      this.iorouter();
      this.room = new Room(); 
      this.httpd.listen(this.config.port, () => console.log("listening on *:" + this.config.port));
    }
    catch(error) {
      logger("Udonite Init Error",error);
      process.exit(-1);
    }
  }

  iorouter(): void {
    this.server.on('connection', (peer: socketio.Socket) => {
      this.renew();
      if (peer.handshake.auth.token !== 'udonite') {
        logger('invalid connection' ,peer)
        peer.disconnect(true)
      }
      let info:ServerInfo = this.getServerInfo();
      this.server.to(peer.id).emit('PeerId',peer.id);
      this.server.to(peer.id).emit('ServerInfo',info);
      this.roomSocket(peer);
      this.objectSocket(peer);
      this.eventSocket(peer);
      this.imageSocket(peer);
      this.audioSocket(peer);
    });
  }
  
  fileReciever() {
    this._express.use(express.json());
    this._express.use(express.urlencoded({ extended: false }));
    this._express.get('/_allData',async (req,res,next) => {
      let roomId = <string>req.query.roomId;
      if (roomId) {
        let alldata = await this.room.room(roomId).ObjectStore.allData();
        if (alldata) {
          let json = JSON.stringify(alldata);
          res.header('Content-Type', 'application/json; charset=utf-8');
          res.send(json);
        }
      }
      next();
    });
    this._express.post('/_image',  multer().single('file'), async (req,res) => {
      let roomId = <string>req.body.roomId;
      let file = req.file;
      if (file && roomId) {
        let buf = file.buffer;
        let type = req.body.type;
        let hash = req.body.hash;
        let filesize = req.body.filesize;
        let owner = req.body.owner;
        let event = await this.room.room(roomId).imageStorage.create(buf,type,hash,filesize,owner)
        if (event) {
          this.server.to(roomId).emit('IMAGE_ADD', event);
        }
      }
      res.send('next');
    });
    this._express.post('/_audio',  multer().single('file'), async (req,res) => {
      let roomId = <string>req.body.roomId;
      let file = req.file;
      if (file && roomId) {
        let buf = file.buffer;
        let name = req.body.name;
        let type = req.body.type;
        let hash = req.body.hash;
        let filesize = req.body.filesize;
        let owner = req.body.owner;
        let event = await this.room.room(roomId).audioStorage.create(buf,name,type,hash,filesize,owner);
        if (event) {
          this.server.to(roomId).emit('AUDIO_ADD', event);
        }
      }
      res.send('next');
    });   
  }

  async renew() {
    let rooms = Object.keys(this.roomPeers);
    for (let roomId of rooms) {
      let players = await this.getPlayers(roomId);
      if (players.length > 0) {
        this.roomPeers[roomId] = players;
      }
      else {
        this.room.sleep(roomId);
        delete this.roomPeers[roomId];
      }
    }    
  }

  async getPlayers(roomId :string):Promise<string[]> {
    let players = await this.server.sockets.adapter.rooms.get(roomId);
    if (players)
      return Array.from(players);
    else
      return [];
  }

  getServerInfo():ServerInfo {
    let info:ServerInfo = {
      version: String(process.env.npm_package_version), 
      roomCount: this.list().length,
      maxRoomCount: this.config.maxRoomCount,
      adminPassword: this.config.adminPassword,
      imageStorageMaxSize: this.config.imageStorageMaxSize,
      audioStorageMaxSize: this.config.audioStorageMaxSize
    }
    return info;
  }

  roomInfo(roomId :string):RoomListContext {
    let room = this.room.roomStore.list.find( room => 
      room.roomId == roomId
    );
    if (room) {
      return  {
        roomName: room.roomName,
        roomId: room.roomId,
        password: room.password,
        isOpen: room.isOpen,
        is2d: room.is2d,
        players: 0
      } as RoomListContext;
    }
    return {
      roomName: "",
      roomId: "",
      password: "",
      isOpen: true,
      is2d: false,
      players:  0
    }
  }
  
  list():RoomListContext[] {
    return this.room.roomStore.list.map( room => {
      return  {
        roomName: room.roomName,
        roomId: room.roomId,
        password: room.password,
        isOpen: room.isOpen,
        is2d: room.is2d,
        players: (this.roomPeers[room.roomId]) ? this.roomPeers[room.roomId].length : 0
      } as RoomListContext;
    });
  }
  create(context :RoomContext ,peerId :string) {
    return this.room.create(context).then(roomId => {
      this.roomPeers[roomId] = [peerId];
       return roomId;
    })
  }
  join(roomId :string ,peerId :string):string {
    if (this.roomPeers[roomId]) {
      this.roomPeers[roomId].push(peerId);
    }
    else {
      this.roomPeers[roomId] = [peerId];
    }
    if (this.room.roomInstance[roomId] && this.room.roomInstance[roomId]?.timeoutId) {
      clearTimeout(this.room.roomInstance[roomId].timeoutId);
    }
    return roomId;
  }
  remove(roomId :string) {
    if ((this.roomPeers[roomId])) return;
    this.room.remove(roomId);
  }

  roomSocket(peer: socketio.Socket) {
    peer.on("roomList",(message,ack) => {
      ack(this.list());
    });
    peer.on("roomCreate",(context :RoomContext ,ack) => {
      try {
        this.create(context,peer.id)
          .then((roomId) => { 
            peer.join(roomId);
            this.ReverseRoomMap.set(peer.id ,roomId)
            ack(this.roomInfo(roomId));
          })
          .catch(error => {
            throw error;
          });
      }
      catch(error) {
        logger("Room Create Error", error)
        ack(-1);
      }
    });
    peer.on("roomJoin",(message,ack) => {
      if (message.roomId) {
        try {
          peer.join(message.roomId);
          this.ReverseRoomMap.set(peer.id ,message.roomId)
          this.join(message.roomId,peer.id);
          ack(this.roomInfo(message.roomId));
        }
        catch(error) {
          logger("Room Join Error", error)
          ack(-1);
        }
      }
      else {
        logger("Room Join infomation colapsed",message)
        ack(-1);
      }
    });
    peer.on("roomRemove",(message,ack) => {
      if (message.roomId) {
        this.remove(message.roomId);
        ack(message.roomId);
      }
      else {
        logger("Room Remove Error",message)
        ack(-1);
      }
    });
    peer.on("myCursor",(cursor :PeerCursor,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id); 
      if (roomId) {
        this.room.room(roomId).addPeer(cursor);
        this.server.to(roomId).emit('PEER_JOIN', peer.id);
        ack(1);
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("otherPeers",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id); 
      if (roomId) {
        ack(this.room.room(roomId).peerCursors);
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });

    peer.on("disconnect", () => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id); 
      if (roomId) {
        peer.leave(roomId);
        this.room.room(roomId).removePeer(peer.id);
        peer.to(roomId).emit('PEER_LIEVE', peer.id);
        this.ReverseRoomMap.delete(peer.id)
      }
      this.renew();
    });
  }
  objectSocket(peer: socketio.Socket) {
    peer.on("objectUpdate",(context :ObjectContext,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).ObjectStore.update(context.identifier ,context)
            .then(isUpdate => {
              if (isUpdate) peer.to(roomId).emit('UPDATE_GAME_OBJECT', context);
              ack(1);
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("ObjectUpdateError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("objectGet",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId && message?.identifier) {
        try {
          let identifier:string = message.identifier;
          this.room.room(roomId).ObjectStore.get(identifier)
            .then(object => {
              if (object) {
                ack(object);
              }
              else {
                this.server.to(roomId).emit('DELETE_GAME_OBJECT', {identifier: identifier});
                ack(1);
              }           
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("ObjectGetError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("getCatalog",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).ObjectStore.getCatalog()
            .then(catalog => {
              ack(catalog);
            })
            .catch(error => {
              throw error;
            });
        }
         catch(error) {
          logger("ObjectCatalogError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("objectRemove",(message,ack) => {
      let roomId =  <string>this.ReverseRoomMap.get(peer.id);
      if (roomId && message?.identifier) {
        let identifier:string = message.identifier;
        try {
          this.room.room(roomId).ObjectStore.delete(identifier)
            .then(() => {
              peer.to(roomId).emit('DELETE_GAME_OBJECT', {identifier: identifier});
            })
             .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("ObjectRemoveError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
  }
  eventSocket(peer: socketio.Socket) {
    peer.on("call",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        if (message.sendTo && this.roomPeers[roomId].includes(message.sendTo)) {
          peer.to(message.sendTo).emit('call', message.event);
        }
        else {
          peer.to(roomId).emit('call', message.event); 
        }
        ack(1);
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("listPeers",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        ack(this.roomPeers[roomId]);
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
  }
  imageSocket(peer: socketio.Socket) {
    peer.on("imageMap",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).imageStorage.getMap()
            .then((map) => {
              ack(map);
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("ImageMapError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("imageUpdate",(context: ImageContext,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).imageStorage.update(context)
            .then((event) => {
              if (event) {
                this.server.to(roomId).emit('IMAGE_UPDATE', event);
              }
              ack(1);
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("ImageUpdateError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
  }
  audioSocket(peer: socketio.Socket) {
    peer.on("audioMap",(message,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).audioStorage.getMap()
            .then((map) => {
              ack(map);
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("AudioMapError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
    peer.on("audioUpdate",(context: AudioContext,ack) => {
      let roomId = <string>this.ReverseRoomMap.get(peer.id);
      if (roomId) {
        try {
          this.room.room(roomId).audioStorage.update(context)
            .then((event) => {
              if (event) {
                this.server.to(roomId).emit('AUDIO_UPDATE', event);
              }
              ack(1);
            })
            .catch(error => {
              throw error;
            });
        }
        catch(error) {
          logger("AudioUpdateError",error);
          ack(-1);
        }
      }
      else {
        logger("User not join Room",peer.id);
        ack(-1);
      }
    });
  }

  close() {
    let rooms = Object.keys(this.roomPeers);
    for (let roomId of rooms) {
      this.room.room(roomId).close();
    }
  }

}

const main = new Server();
