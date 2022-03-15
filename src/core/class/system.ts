export interface ConfigContext  {
  port: number ,
  url: string ,
  maxRoomCount: number;
  roomPerPage: number;
  adminPassword: string;
  imageStorageMaxSize: number;
  audioStorageMaxSize: number;
}

export interface configYamlContext {
  server: {
    url: string,
    port: number
  }
  db: {
    ip: string,
    port: number
    user: string,
    password: string,
  }
  storage: {
    imageDataPath: string,
    imageUrlPath: string,
    imageStorageMaxSize: string,
    audioDataPath: string,
    audioUrlPath: string,
    audioStorageMaxSize: string,
  }
  setting: {
    adminPassword: string,
    maxRoomCount: number
  }
}

export interface ServerInfo {
  version: string;
  maxRoomCount: number;
  roomPerPage: number;
  adminPassword: string;
  imageStorageMaxSize: number;
  audioStorageMaxSize: number;
}
