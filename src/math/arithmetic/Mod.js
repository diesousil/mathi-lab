import MathFunction from "../MathFunction.js";

class Mod extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    execute(params) {

        let inputNumber = params[0];

        if(inputNumber < 0) {
            inputNumber *= -1;
        }

        return inputNumber;

    }
}

export default Mod;