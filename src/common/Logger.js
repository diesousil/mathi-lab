import fileHandler from "node:fs";

export default class Logger {
    static log(message) {
        fileHandler.writeFileSync("main.long","\n" + message, { flag: 'a+' });
        //console.log(message);
    }
}