import MathFunction from "../MathFunction.js";

class Sum extends MathFunction{

    constructor() {
        super();
    }

    execute(params) {
        return params[0] + params[1];
    }
} 

export default Sum;