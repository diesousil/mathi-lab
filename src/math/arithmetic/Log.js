import MathFunction from "../MathFunction.js";

class Root extends MathFunction{

    constructor() {
        super();
    }

    execute(params) {

        let base = params[1];
        let number = params[0];

        return Math.log(number)/Math.log(base);

    }
}

export default Root;