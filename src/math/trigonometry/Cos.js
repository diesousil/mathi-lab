import MathFunction from "../MathFunction.js";

class Cos extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    execute(params) {

        let inputNumber = params[0];

        return Math.cos(inputNumber);

    }
}

export default Cos;