import config from 'config';
import { getTextHash } from '../tools/file-tool';
import { ConfigContext} from './class/system';
import { systemLog , errorLog } from "../tools/logger";
import { storage } from './udonarium/storage';

interface databaseContext {
  ip :string;
  port :string;
  user :string;
  password :string;
}

export async function loadConfig(): Promise<ConfigContext>{
  systemLog("loading config");
  let yaml = config;
  process.env.NODE_ENV = "UdoniteServer";
  process.env.db = dbUri( {
    ip:  yaml.get<string>('db.ip'),
    port: yaml.has('db.port') ? yaml.get<string>('db.port') : "27017",
    user:  yaml.has('db.user') ? yaml.get<string>('db.user') : "",
    password: yaml.has('db.password') ? yaml.get<string>('db.password') : ""
  });
  let storageType = yaml.has('storage.storageType') ? yaml.get<number>('storage.storageType') : 1;
  switch(storageType) {
    case 2:
      process.env.storageType = 's3';
      process.env.s3BucketName = yaml.has('storage.s3BucketName') ? yaml.get<string>('storage.s3BucketName') : "";
      process.env.imageUrlPath =  yaml.get<string>('storage.s3UrlPath');
      process.env.audioUrlPath =  yaml.get<string>('storage.s3UrlPath');
      break;
    case 1:
    default:
      process.env.storageType = 'local';
      process.env.imageDataPath = yaml.get<string>('storage.imageDataPath'); 
      process.env.imageUrlPath =  yaml.get<string>('storage.imageUrlPath');
      process.env.audioDataPath =  yaml.get<string>('storage.audioDataPath');
      process.env.audioUrlPath =  yaml.get<string>('storage.audioUrlPath');
  }
  let tmpStorage = new storage('image');
  if (!tmpStorage.accessTest()) {
    throw "Cant access Storage";
  }
  systemLog('Storage access Successful')
  process.env.logFilePath =  yaml.get<string>('log.filePath');

  let result:ConfigContext =
   {
    port: yaml.get<number>('server.port'),
    url:  yaml.get<string>('server.url'),
    maxRoomCount: yaml.get<number>('setting.maxRoomCount'),
    roomPerPage: yaml.get<number>('setting.roomPerPage'),
    adminPassword: getTextHash(yaml.get<string>('setting.adminPassword')),
    imageStorageMaxSize: yaml.get<number>('storage.imageStorageMaxSize'),
    audioStorageMaxSize: yaml.get<number>('storage.audioStorageMaxSize')
  };

  systemLog("config load end");
  return result;
}

function dbUri(context :databaseContext):string {
  let uri:string = "";
  if (context.ip.match(/mongodb\.net$/)) {
    if (context.user && context.password) {
      uri = 'mongodb+srv://' + context.user + ':' + context.password  + '@' + context.ip + '/?serverSelectionTimeoutMS=15000&w=majority';
    }
    else throw "Must user and password if you use MongoDB Atlas";
  }
  else {
    uri = (context.user && context.password) ? 
    ('mongodb://' + context.user + ':' + context.password  + '@' + context.ip + ':' + context.port + '/') :
    ('mongodb://' + context.ip + ':' + context.port + '/') ;
  };
  return uri;
}
