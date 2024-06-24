import Logger from "../common/Logger.js";
import functionDictionary from "../data/functionDictionary.js";

class InputMethod {

    constructor() {
        Logger.log("Loading input method: " + this.constructor.name);
    }

    async callMathFunction(key, params) {
        
        Logger.log("Loading math function: " + functionDictionary[key])
        const classToImport = "../" + functionDictionary[key] + ".js";
        const mathMethodClass = await import(classToImport);
        
        const mathFunction = new mathMethodClass.default();
        const result = mathFunction.execute(params);

        return result;
    }

}

export default InputMethod;