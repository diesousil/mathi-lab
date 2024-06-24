import MathFunction from "../MathFunction.js";

class Power extends MathFunction{

    constructor() {
        super();
    }

    execute(params) {
        return Math.pow(params[0],params[1]);
    }
} 

export default Power;