import { configure, getLogger } from "log4js";

const logfilePath:string = process.env.logFilePath ? process.env.logFilePath : './log/udonite.log' ;

configure({
  appenders: {
    console: {
      type: "console"
    },
    logfile: { type: "file", filename: logfilePath }
  },
  categories: { default: { appenders: ["console", "logfile"], level: "error" } }
});

const log4js = getLogger();
log4js.level = "debug";

export function systemLog(log :string ,roomId :string = '' ,error? :any)  {
  log4js.info(roomId + ": " + log)
  if (error) log4js.trace(roomId + ": " + error)
}

export function errorLog(log :string ,roomId :string = '' ,error? :any)  {
  if (error) {
    log4js.error(roomId + ": " + log);
    log4js.error(error);
  }
  else {
    log4js.warn(roomId + ": " + log);
  }
}

