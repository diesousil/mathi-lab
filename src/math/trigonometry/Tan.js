import MathFunction from "../MathFunction.js";

class Tan extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    execute(params) {

        let inputNumber = params[0];

        return Math.tan(inputNumber);

    }
}

export default Tan;