import Logger from "../common/Logger.js";
class MathFunction {

    constructor() {
        this.paramsQty = 2;
        if(this.execute == undefined) {
            Logger.log("Undefined execute method for " + this.constructor.name);
            throw new Exception( this.constructor.name + " math function should implement execute method");
        }
    }


}

export default MathFunction;