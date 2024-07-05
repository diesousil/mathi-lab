import MathFunction from "../MathFunction.js";

class Root extends MathFunction{

    constructor() {
        super();
    }

    execute(params) {

        let base = params[0];
        let expoent = 1/parseFloat(params[1]);

        return Math.pow(base, expoent);

    }
}

export default Root;