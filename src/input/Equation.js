import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import * as shared from "../data/shared.js";
import MathExpression from "./MathExpression.js";

class Equation extends InputMethod {
    constructor() {
        super();
    }


    validate(query) {
        let validation = true;

        validation = validation && query.matchAll('=').length == 1;

        return validation;
    }

    extractCompents(expression) {
        return [
            shared.extractVariables(expression),
            shared.extractOperators(expression),
            shared.extractNumbers(expression),
            //shared.extractFunctions(expression)
        ];
    }

    moveNumbers(leftExpression, rightExpression, maxIndex) {


        Logger.debug("== Started move numbers ==");
        Logger.debug("Left expression:" + shared.debugArray(leftExpression));
        Logger.debug("Right expression:" + shared.debugArray(rightExpression));

        for(let i = 0;i<leftExpression[2].length;i++) {
            const number = leftExpression[2][i];
            const operatorIndex = leftExpression[1].findIndex(x => x[1] == number[1]-1);
            const operator = leftExpression[1][operatorIndex];

            Logger.debug("dealing with number:" + shared.debugArray(number));
            Logger.debug("its operator:" + shared.debugArray(operator));

            let newOperator = shared.inverseOperator[operator[0]];
            maxIndex += 1;
            rightExpression[1].push([newOperator,maxIndex]);
            maxIndex += 1;
            number[1] = maxIndex;
            rightExpression[2].push(number);

            leftExpression[2].splice(i,1);
            leftExpression[1].splice(operatorIndex, 1)
        }

        Logger.debug("updated Left expression:" + shared.debugArray(leftExpression));
        Logger.debug("updated Right expression:" + shared.debugArray(rightExpression));

    }

    rebuildExpression(expressionArrays) {

        let expression = "";
        let integratedArray = expressionArrays[0].concat(expressionArrays[1],expressionArrays[2]);
        
        
        integratedArray = integratedArray.sort((a,b) => a[1]-b[1]);
        
        for(let i=0;i<integratedArray.length;i++) {
            expression += integratedArray[i][0];
        }

        return expression;
    }

    async process(req) {
        Logger.info("== Started Equation process ==");
        Logger.debug("Original input: " + req.query);
        let query = req.query;
        let maxIndex = query.length;

        /*
        if(!this.validate(query)) {
            return "error";
        }
            */
        
        let [leftExpression, rightExpression] = query.split('=').map(x => this.extractCompents(x));

        this.moveNumbers(leftExpression, rightExpression, maxIndex);
        const expression = this.rebuildExpression(rightExpression);
        Logger.debug("rebuilt right expression before solve:" + expression);

        let mathExpression = new MathExpression();
        let finalResult = await mathExpression.process({ query: expression} );
        Logger.info("Final result:" + finalResult);

        return finalResult;
    }
}

export default Equation;
