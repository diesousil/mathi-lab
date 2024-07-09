import Logger from "../common/Logger.js";
import functionDictionary from "../data/functionDictionary.js";

class InputMethod {

    constructor() {
        this.mathFunction = null;
        Logger.debug("Loading input method: " + this.constructor.name);
    }

    async retrieveMathFunction(key) {
        Logger.debug("Loading math function: " + functionDictionary[key])
        const classToImport = "../" + functionDictionary[key] + ".js";
        const mathMethodClass = await import(classToImport)

        this.mathFunction = new mathMethodClass.default();
        return this.mathFunction;        
    }

    async retrieveParamsCount(key) {
        if(this.mathFunction == null) {
            await this.retrieveMathFunction(key);
        }

        return this.mathFunction.paramsQty;
        
    }

    async callMathFunction(params, key = null) {
        
        if(this.mathFunction == null) {
            if(key == null) {
                throw new Error("As mathFunction has not been set yet, key parameter should be providen.");
            }

            await this.retrieveMathFunction(key);
        }
        
        let result = this.mathFunction.execute(params);

        return result;
    }

    resetMathFunction() {
        this.mathFunction = null;
    }

}

export default InputMethod;