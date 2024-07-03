import MathFunction from "../MathFunction.js";

class Sin extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    execute(params) {

        let inputNumber = params[0];

        return Math.sin(inputNumber);

    }
}

export default Sin;