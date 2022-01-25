import config from 'config';
import { ConfigContext} from './class/system';

export function loadConfig(): ConfigContext{
  console.log("loading config");
  let yaml = config;
  process.env.NODE_ENV = "UdoniteServer";
  process.env.db = dbUri(yaml.get('db.ip'),yaml.get('db.port')); 
  process.env.imageDataPath = String(yaml.get('storage.imageDataPath')); 
  process.env.imageUrlPath =  String(yaml.get('storage.imageUrlPath'));
  process.env.audioDataPath =  String(yaml.get('storage.audioDataPath'));
  process.env.audioUrlPath =  String(yaml.get('storage.audioUrlPath'));

  let result:ConfigContext =
   {
    port: yaml.get('server.port'),
    url:  yaml.get('server.url'),
    maxRoomCount: Number(yaml.get('setting.maxRoomCount')),
    adminPassword: String(yaml.get('setting.adminPassword')),
    imageStorageMaxSize: Number(yaml.get('storage.imageStorageMaxSize')),
    audioStorageMaxSize: Number(yaml.get('storage.audioStorageMaxSize'))
  };

  console.log("config load end");
  return result;
}

function dbUri(ip :string, port :string ,):string {
  let uri:string = 'mongodb://' + ip + ':' + port + '/';
  return uri;
}
