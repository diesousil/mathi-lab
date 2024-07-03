import MathFunction from "../MathFunction.js";

class Pi extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 0;
    }

    execute(params) {

        return Math.PI;

    }
}

export default Pi;