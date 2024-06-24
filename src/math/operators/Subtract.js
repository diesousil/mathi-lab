import MathFunction from "../MathFunction.js";

export default class Sum extends MathFunction{

    constructor() {
        super();
    }

    execute(params) {
        return params[0] - params[1];
    }
} 