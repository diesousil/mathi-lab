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

    incrementAllIndexesBiggerThan(expressionArrs, pivotIndex, increment = 1) {
        
        for(let i=0;i<expressionArrs.length;i++) {
            for(let j=0;j<expressionArrs[i].length;j++) {
                if(expressionArrs[i][j][1] > pivotIndex)
                    expressionArrs[i][j][1]+=increment;
            }
        }

    }

    async processDistributive(expression, factor = null, operator = null) {       
        
        if(!shared.containsVariables(expression)) {
            if(shared.containsOperators(expression)) {
                expression =  await this.solveMathExpression(expression);
            }
        } else {
            Logger.debug("\n\nStarting processDistributive: expression = "+expression+", factor="+factor+", operator="+operator);

            let expressionMarkers = [...expression].map((expressionChar, index) => (shared.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);
            Logger.debug("\nexpressionMarkers=" + shared.debugArray(expressionMarkers));
            
            while (expressionMarkers && expressionMarkers.length > 0) {
                const openMarkerIndex = expressionMarkers[0];
                Logger.debug("\nopenMarkerIndex=" + openMarkerIndex);
                const closeMarkerIndex = shared.getCloseMarkerIndex(openMarkerIndex, expression);
                Logger.debug("\ncloseMarkerIndex=" + closeMarkerIndex);
                const subExpresion = expression.substring(openMarkerIndex+1, closeMarkerIndex);
                Logger.debug("\nsubExpresion=" + subExpresion);
                const subExpressionOperator = expression.charAt(openMarkerIndex - 1);
                Logger.debug("\nsubExpressionOperator=" + subExpressionOperator);
                const [subExpressionFactor, subExpressionFactorIndex] = shared.retrievePreviousFactor(expression, openMarkerIndex-1);
                Logger.debug("\subExpressionFactor=" + subExpressionFactor + ", subExpressionFactorIndex="+subExpressionFactorIndex);
    
                let distributedSubExpression = await this.processDistributive(subExpresion, subExpressionFactor, subExpressionOperator);
                Logger.debug("\ndistributedSubExpression=" + distributedSubExpression + ", operator="+subExpressionOperator);
    
                const subExpressionToReplace = expression.substring(subExpressionOperator == '+' || subExpressionOperator == '-'?openMarkerIndex:subExpressionFactorIndex, 
                                                                    openMarkerIndex + subExpresion.length + 2);
                Logger.debug("\nsubExpressionToReplace=" + subExpressionToReplace);
                expression = expression.replace(subExpressionToReplace, distributedSubExpression);
                Logger.debug("\nexpression=" + expression);
                
                expressionMarkers = [...expression].map((expressionChar, index) => (shared.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);            
                Logger.debug("\nupdated expressionMarkers=" + shared.debugArray(expressionMarkers));
            }
        }        


        if(factor != null && operator != null) {

            let expressionArrs = this.extractCompents(expression);
            Logger.debug("\nexpressionArrs=" + shared.debugArray(expressionArrs));
            let expressionNumbers = expressionArrs[2];

            if(shared.isLetter(factor)) {

                Logger.debug("\n " + expression + " " + operator + " " + factor);

                for(let i=0;i<expressionNumbers.length;i++) {
                    let operatorIndex = expressionNumbers[i][1] + expressionNumbers[i][0].length - 1;
                    this.incrementAllIndexesBiggerThan(expressionArrs, operatorIndex,2)

                    expressionArrs[1].push([operator,operatorIndex+1]);
                    expressionArrs[0].push([factor,operatorIndex+2]);

                    Logger.debug("\nupdated expressionArrs=" + shared.debugArray(expressionArrs));
                }

            } else {

                switch (operator) {
                    case '*':
                        for(let i=0;i<expressionNumbers.length;i++) {
                            expressionNumbers[i][0] = factor * expressionNumbers[i][0];
                        }
                        break;
    
                    case '/':
                        for(let i=0;i<expressionNumbers.length;i++) {
                            expressionNumbers[i][0] = factor / expressionNumbers[i][0];
                        }
                    case '-':
                        for(let i=0;i<expressionNumbers.length;i++) {
                            expressionNumbers[i][0] = (-1) * expressionNumbers[i][0];
                        }
                        break;
                    default: 
                        break;
                }
            }


            expression = this.rebuildExpression(expressionArrs);
            Logger.info("expression rebuild after distributive: " + expression);
        }

        Logger.debug("\nEnd processDistributive: expression = "+expression+", factor="+factor+", operator="+operator+"\n\n");
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
        let expressionArray = query.split('=');

        for(let i=0;i<expressionArray.length;i++) {
            expressionArray[i] = await this.processDistributive(expressionArray[i]);
            expressionArray[i] = this.extractCompents(expressionArray[i]);
        }

        let [leftExpression, rightExpression] = expressionArray;

        this.separateNumbersAndVars(leftExpression, rightExpression, maxIndex);
        
        let expression = this.rebuildExpression(rightExpression);
        let leftExpressionRebuilt = this.rebuildExpression(leftExpression);
        Logger.debug("before solve - left:" + leftExpressionRebuilt);
        Logger.debug("before solve - right:" + expression);

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
