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
        Logger.debug("Expression:" + shared.debugArray(expression));
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

        let postOperator = -1;

        if(postOperatorIndex > -1) {
            postOperator = expression[1][postOperatorIndex];
        }

        return postOperator;
    }

    separateNumbersAndVars(leftExpression, rightExpression, maxIndex) {

        for(let i = 0;i<leftExpression[2].length;i++) {
            const number = leftExpression[2][i];
            const [prevOperator, prevOperatorIndex] = this.findPrevOperator(leftExpression, number);
            if(prevOperator != -1) {

                const postOperator = this.findPostOperator(leftExpression, number); 

                if( ['*','/'].includes(postOperator)) {
                    continue;
                }

   
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

    }

    extractNumberAndOperator(expression, openMarkerIndex) {
        let operator = expression.charAt(openMarkerIndex-1);

        let number = "";
        for(let i=openMarkerIndex-2;i>=0;i--) {
            let chr = expression.charAt(i);
            if(shared.isNumericChar(chr) || chr == '.') {
                number = chr + number;
            }
        }

        return [parseFloat(number), operator];

    }

    processDistributive(expression, number = null, operator = null) {        
        
        let expressionMarkers = [...expression].map((expressionChar, index) => (shared.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);
        
        while (expressionMarkers && expressionMarkers.length > 0) {
            const openMarkerIndex = expressionMarkers[0];
            const closeMarkerIndex = shared.getCloseMarkerIndex(openMarkerIndex, expression);
            const subExpresion = expression.substring(openMarkerIndex+1, closeMarkerIndex);
            const subExpressionOperator = expression.charAt(openMarkerIndex - 1);
            const [subExpressionNumber, subExpressionNumberIndex] = shared.retrieveNumberBeforePosition(expression, openMarkerIndex-1);

            let distributedSubExpression = this.processDistributive(subExpresion, subExpressionNumber, subExpressionOperator);

            const subExpressionToReplace = expression.substring(subExpressionNumberIndex, openMarkerIndex + subExpresion.length + 2);
            expression = expression.replace(subExpressionToReplace, distributedSubExpression);
            
            expressionMarkers = [...expression].map((expressionChar, index) => (shared.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);            
        }

        if(number != null && operator != null) {
            let expressionArrs = this.extractCompents(expression);
            let expressionNumbers = expressionArrs[2];

            switch (operator) {
                case '*':
                    for(let i=0;i<expressionNumbers.length;i++) {
                        expressionNumbers[i][0] = number * expressionNumbers[i][0];
                    }
                    break;

                case '/':
                    for(let i=0;i<expressionNumbers.length;i++) {
                        expressionNumbers[i][0] = number / expressionNumbers[i][0];
                    }
                case '-':
                    for(let i=0;i<expressionNumbers.length;i++) {
                        expressionNumbers[i][0] = (-1) * expressionNumbers[i][0];
                    }
                    break;
                default: 
                    break;
            }            

            expression = this.rebuildExpression(expressionArrs);
            Logger.info("expression rebuild after distributive: " + expression);
        }

        return expression;
    }
    
    async solveSimplified(leftExpression, rightValue) {

        let result = rightValue;

        if(leftExpression[2].length > 0) {
            let number = leftExpression[2][0][0].toString();

            const operatorToReplace = leftExpression[1][0][0];
            const operator = shared.inverseOperator[operatorToReplace];

            let expression = result.toString() + operator + number;
            result = await this.solveMathExpression(expression);
        }

        return result;
    }

    async solve(query) {

        let maxIndex = query.length;
        let [leftExpression, rightExpression] = query.split('=').map(expr => this.extractCompents(this.processDistributive(expr)));
        this.separateNumbersAndVars(leftExpression, rightExpression, maxIndex);
        
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
        Logger.info("Original input: " + req.query);

        let formattedQuery = shared.formatWithImplicitOperators(req.query);
        Logger.info("Formatted input: " + formattedQuery);

        let result = await this.solve(formattedQuery);
        Logger.info("Final result: " + result);

        return result;
    }
}

export default Equation;
