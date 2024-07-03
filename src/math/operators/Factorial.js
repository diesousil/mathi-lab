import MathFunction from "../MathFunction.js";

class Factorial extends MathFunction{

    constructor() {
        super();
        this.paramsQty = 1;
    }

    defaultFactorial(inputNumber) {
        if(inputNumber > 0) {
            return this.defaultFactorial(inputNumber-1)*inputNumber;
        } else {
            return 1;
        }
    }

    gammaApproximation(inputNumber) {
        // Lanczos Approximation of the Gamma Function
        // As described in Numerical Recipes in C (2nd ed. Cambridge University Press, 1992)
        // Extracted from: https://stackoverflow.com/questions/3959211/what-is-the-fastest-factorial-function-in-javascript

        let isNegative = (inputNumber < 0);
        
        if(isNegative)
            inputNumber *= -1;

        let z = inputNumber + 1;
        let p = [1.000000000190015, 76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 1.208650973866179E-3, -5.395239384953E-6];

        let d1 = Math.sqrt(2 * Math.PI) / z;
        let d2 = p[0];

        for (var i = 1; i <= 6; ++i)
        d2 += p[i] / (z + i);

        var d3 = Math.pow((z + 5.5), (z + 0.5));
        var d4 = Math.exp(-(z + 5.5));

        let d = d1 * d2 * d3 * d4;

        if(isNegative)
            d *= -1;

        return d;
    }


    execute(params) {

        let inputNumber = params[0];

        if(Number.isInteger(inputNumber) && inputNumber > 0) {
            return this.defaultFactorial(parseInt(inputNumber));
        } else {
            return this.gammaApproximation(parseFloat(inputNumber));
        }

    }
}

export default Factorial;