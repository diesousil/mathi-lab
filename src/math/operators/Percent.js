import MathFunction from "../MathFunction.js";

export default class Divide extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    execute(params) {
        return params[0] / 100;
    }
} 