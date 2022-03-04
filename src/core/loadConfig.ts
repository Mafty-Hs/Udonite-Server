import config from 'config';
import { getTextHash } from '../tools/file-tool';
import { ConfigContext} from './class/system';
import { systemLog , errorLog } from "../tools/logger";

export function loadConfig(): ConfigContext{
  systemLog("loading config");
  let yaml = config;
  process.env.NODE_ENV = "UdoniteServer";
  process.env.db = dbUri(yaml.get('db.ip'),yaml.get('db.port')); 
  process.env.imageDataPath = String(yaml.get('storage.imageDataPath')); 
  process.env.imageUrlPath =  String(yaml.get('storage.imageUrlPath'));
  process.env.audioDataPath =  String(yaml.get('storage.audioDataPath'));
  process.env.audioUrlPath =  String(yaml.get('storage.audioUrlPath'));
  process.env.logFilePath =  String(yaml.get('log.filePath'));

  let result:ConfigContext =
   {
    port: yaml.get('server.port'),
    url:  yaml.get('server.url'),
    maxRoomCount: Number(yaml.get('setting.maxRoomCount')),
    roomPerPage: Number(yaml.get('setting.roomPerPage')),
    adminPassword: getTextHash(String(yaml.get('setting.adminPassword'))),
    imageStorageMaxSize: Number(yaml.get('storage.imageStorageMaxSize')),
    audioStorageMaxSize: Number(yaml.get('storage.audioStorageMaxSize'))
  };

  systemLog("config load end");
  return result;
}

function dbUri(ip :string, port :string ,):string {
  let uri:string = 'mongodb://' + ip + ':' + port + '/';
  return uri;
}
