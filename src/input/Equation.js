import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import * as shared from "../data/shared.js";
import MathExpression from "./MathExpression.js";

class Equation extends InputMethod {
    constructor() {
        super();
        this.mathExpressionSolver = null;
    }

    async solveMathExpression(expression) {
        
        if(this.mathExpressionSolver == null) {
            this.mathExpressionSolver = new MathExpression();
        }

        return await this.mathExpressionSolver.process({ query: expression} );

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

    findPrevOperator(expression, number) {
        const prevOperatorIndex = expression[1].findIndex(x => x[1] == number[1]-1);
        let prevOperator = -1;

        if(prevOperatorIndex > -1) {
            prevOperator = expression[1][prevOperatorIndex];
        }

        return [prevOperator, prevOperatorIndex];

    }

    findPostOperator(expression, number) {
        const expectedPostOperatorCharPos = number[1]+number[1].toString().length+1;
        const postOperatorIndex = expression[1].findIndex(x => x[1] == expectedPostOperatorCharPos);
        Logger.debug("expectedPostOperatorCharPos:" + expectedPostOperatorCharPos);
        Logger.debug("found:" + postOperatorIndex);

        let postOperator = -1;

        if(postOperatorIndex > -1) {
            postOperator = expression[1][postOperatorIndex];
        }

        return postOperator;
    }

    moveNumbers(leftExpression, rightExpression, maxIndex) {


        Logger.debug("== Started move numbers ==");
        Logger.debug("Left expression:" + shared.debugArray(leftExpression));
        Logger.debug("Right expression:" + shared.debugArray(rightExpression));

        for(let i = 0;i<leftExpression[2].length;i++) {
            const number = leftExpression[2][i];

            Logger.debug("Number:" + number);
            const [prevOperator, prevOperatorIndex] = this.findPrevOperator(leftExpression, number);
            if(prevOperator != -1) {

                const postOperator = this.findPostOperator(leftExpression, number); 

                if( ['*','/'].includes(postOperator)) {
                    continue;
                }

                Logger.debug("dealing with number:" + shared.debugArray(number));
                Logger.debug("its operator:" + shared.debugArray(prevOperator));
    
                let newOperator = shared.inverseOperator[prevOperator[0]];
                maxIndex += 1;
                rightExpression[1].push([newOperator,maxIndex]);
                maxIndex += 1;
                number[1] = maxIndex;
                rightExpression[2].push(number);
    
                leftExpression[2].splice(i,1);
                leftExpression[1].splice(prevOperatorIndex, 1)
            }
        }

        Logger.debug("updated Left expression:" + shared.debugArray(leftExpression));
        Logger.debug("updated Right expression:" + shared.debugArray(rightExpression));

    }

    simplify(leftExpression, rightExpression, maxIndex) {


        this.moveNumbers(leftExpression, rightExpression, maxIndex);

    }

    async solveSimplified(leftExpression, rightValue) {

        let result = rightValue;

        if(leftExpression[2].length > 0) {
            let number = leftExpression[2][0][0].toString();
            const operatorToReplace = leftExpression[1][0][0];
            Logger.info("operatorToReplace:" + operatorToReplace);
            const operator = shared.inverseOperator[operatorToReplace];
            Logger.info("operator:" + operator);
            let expression = result.toString() + operator + number;
            Logger.info("New expression:" + expression);
            result = await this.solveMathExpression(expression);
        }

        return result;
    }

    async solve(query) {

        let maxIndex = query.length;

        let [leftExpression, rightExpression] = query.split('=').map(x => this.extractCompents(x));

        this.simplify(leftExpression, rightExpression, maxIndex);
        let expression = this.rebuildExpression(rightExpression);

        Logger.debug("rebuilt right expression before solve:" + expression);

        let result = await this.solveMathExpression(expression);
         
        Logger.info("Partial result:" + result);
        Logger.info("Left Expression:" + shared.debugArray(leftExpression));

        result = await this.solveSimplified(leftExpression, result);

        return result;
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

        let result = await this.solve(req.query);

        Logger.debug("Final result: " + result);

        return result;
    }
}

export default Equation;
