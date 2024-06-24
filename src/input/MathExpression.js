import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";

class MathExpression extends InputMethod {

    constructor() {
        super();
    }

    getOperatorsPriorityFifo() {
        return [['+','-'], ['*','/'], ['^']];
    }


    async process(req) {

        const expression = req.query;
        Logger.log("Expression: " + expression);
        const priorityFifo = this.getOperatorsPriorityFifo();
        
        let numbers = [...expression.matchAll(/\d+/g)].map((num) => parseInt(num));
        let operators = [...expression.matchAll(/\D+/g)];
        
        Logger.log("\nNumbers:" + numbers.toString());
        Logger.log("Operators:" + operators.toString());


        while(operators.length > 0) {

            let opFifoItem = priorityFifo.pop();
            
            if(opFifoItem != undefined) {
                Logger.log("\nopFifoItem: " + opFifoItem.toString());
                let ocurrences = [];
                do {
                    ocurrences = operators.map((element, index) => opFifoItem.includes(element[0])? index : undefined).filter(x => x!= undefined);

                    if(ocurrences != undefined && ocurrences.length > 0) {
                        Logger.log("Ocurrences: " + ocurrences.toString());
                        
                        let opIndex = ocurrences[0];
                        let operator = operators[opIndex];
                        let n1 = numbers[opIndex];
                        let n2 = numbers[opIndex+1];
                        Logger.log("Processing: " + n1 + " " + operator + " " + n2)
                        const result = await this.callMathFunction(operator, [n1, n2]);
                        Logger.log("Result: " + result)

                        numbers[opIndex] = result;
                        numbers.splice(opIndex+1, 1);

                        operators.splice(opIndex, 1);
                        
                        Logger.log("\n\nUpdated Operators array: " + operators.toString());
                        Logger.log("Updated NUmbers array: " + numbers.toString());
                    }
    

                } while(ocurrences.length > 0);
            }
        }

        const finalResult = numbers.pop();
        Logger.log("\n\nFinal result:" + finalResult);

        return finalResult;
    }



}

export default MathExpression;