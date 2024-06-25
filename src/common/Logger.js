import fileHandler from "node:fs";

export default class Logger {
    static log(message) {
        fileHandler.writeFileSync("main.log","\n" + message, { flag: 'a+' });
        //console.log(message);
    }
}