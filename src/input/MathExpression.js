import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import * as shared from "../data/shared.js";

class MathExpression extends InputMethod {
    constructor() {
        super();
    }

    handleDoubleOperators(numbers, operators) {
        const doubleOperators = operators.map((operator, index) => operator[0].length > 1 ? index : undefined).filter(x => x != undefined);

        if (doubleOperators && doubleOperators.length > 0) {
            Logger.debug("doubleOperators:" + shared.debugArray(doubleOperators));

            doubleOperators.forEach(index => {
                numbers[index + 1][0] = parseInt(operators[index][0].charAt(1) + "1") * numbers[index + 1][0];
                operators[index][0] = operators[index][0].charAt(0);
            });

            Logger.debug("doubleOperators updated numbers:" + shared.debugArray(numbers));
            Logger.debug("doubleOperators updated operators:" + shared.debugArray(operators));
        }
    }

    handleFirstCharOperator(numbers, operators, expression) {
        const isFirstCharOperator = (expression.charAt(0).match(shared.isOperatorRegex) != null);
        Logger.debug("First exp char:" + expression.charAt(0) + " <- is operator ? -> " + isFirstCharOperator);
        if (isFirstCharOperator) {
            operators.splice(0, 1);
            numbers[0][0] *= parseInt(expression.charAt(0) + "1");
            Logger.debug("Changed Numbers:" + shared.debugArray(numbers));
            Logger.debug("Changed Operators:" + shared.debugArray(operators));
        }
    }

    retrieveFunctionParameterMarkers(expression) {
        const indexes = [];
        let match;
        while ((match = shared.isFunctionWithParameterRegex.exec(expression)) !== null) {
            let functionIndex = match.index;
            let openMarkerIndex;
            let closeMarkerIndex;
            let i = functionIndex;
            
            while(expression.charAt(i) != '(') {
                Logger.debug(expression.charAt(i));
                i++;
            }
            
            openMarkerIndex = i;
            let qtOpenMarker = 1;

            while(qtOpenMarker > 0) {

                i++;
                Logger.debug(expression.charAt(i));
                Logger.debug(qtOpenMarker);
                if(expression.charAt(i) == '(') {
                    qtOpenMarker+=1;
                } else if(expression.charAt(i) == ')') {
                    qtOpenMarker-=1;
                }
            }
            closeMarkerIndex = i;
            indexes.push(openMarkerIndex, closeMarkerIndex);
        }

        return indexes;
    }

    async solveFunctions(numbers, operators, functions, functionParameterMarkers, expression) {
        for (let i = 0; i < functions.length; i++) {


            let functionName = functions[i];
            Logger.debug("trying to load function: " + functionName[0]);
            const paramsQty = await this.retrieveParamsCount(functionName[0]);

            Logger.debug("function param count:" + paramsQty);

            let paramValues = [];

            if(paramsQty > 0) {
                let openMarkerParamIndex = functionParameterMarkers[i*2];
                let closeMarkerParamIndex = functionParameterMarkers[i*2+1];
                let paramExpressions = shared.splitOutsideParentheses(expression.substring(openMarkerParamIndex+1, closeMarkerParamIndex));

                Logger.debug("function "+functionName[0]+" params: " + shared.debugArray(paramExpressions));


                let paramExpressionProcessor = new MathExpression();
                for(let j=0;j<paramExpressions.length;j++) {                    
                    let paramValueResult = await paramExpressionProcessor.process({query: paramExpressions[j]});
                    paramValues.push(paramValueResult);
                    paramExpressionProcessor.resetMathFunction();
                }

                numbers = numbers.filter( (number) => number[1] < openMarkerParamIndex || number[1] > closeMarkerParamIndex  );
                Logger.debug("updated numbers after function " + functionName[0] + ":" + shared.debugArray(numbers));

                operators = operators.filter( (operator) => operator[1] < openMarkerParamIndex || operator[1] > closeMarkerParamIndex  );
                Logger.debug("updated operators after function " + functionName[0] + ":" + shared.debugArray(operators));
            }

            Logger.debug("function "+functionName[0]+" param values: " + shared.debugArray(paramValues));

            const result = await this.callMathFunction(paramValues);
            this.resetMathFunction();
            numbers.splice(0, 0, [result, functionName[1]]);
            Logger.debug("updated numbers with function " + functionName[0] + " result:" + shared.debugArray(numbers));

        }

        return [numbers, operators];
    }

    async solveOperations(numbers, operators) {
        while (operators.length > 0) {
            for (let i = 0; i < shared.operationsPriorityOrder.length; i++) {
                const operationsToCheck = shared.operationsPriorityOrder[i];
                Logger.debug("\operationsToCheck: " + operationsToCheck.toString());

                let occurrences = [];
                do {
                    occurrences = operators.map((element, index) => operationsToCheck.includes(element[0][0]) ? index : undefined).filter(x => x != undefined);

                    if (occurrences && occurrences.length > 0) {
                        Logger.debug("Occurrences: " + occurrences.toString());

                        const opIndex = occurrences[0];
                        const operator = operators[opIndex][0];
                        const paramsQty = await this.retrieveParamsCount(operator);
                        const params = numbers.slice(opIndex, opIndex + paramsQty).map(x => 1 * x[0]);

                        Logger.debug("Operator: " + operator + " params count: " + paramsQty);
                        Logger.debug("Processing: " + operator + " with params " + shared.debugArray(params));
                        const result = await this.callMathFunction(params);
                        Logger.debug("Result: " + result);
                        this.resetMathFunction();

                        numbers[opIndex][0] = result;
                        numbers.splice(opIndex + 1, paramsQty - 1);
                        operators.splice(opIndex, 1);

                        Logger.debug("Updated Operators array: " + shared.debugArray(operators));
                        Logger.debug("Updated Numbers array: " + shared.debugArray(numbers));
                    }
                } while (occurrences.length > 0);
            }
        }
    }

    
    async solve(expression, functionParameterMarkers) {
        let numbers = shared.extractNumbers(expression);
        Logger.debug("Numbers:" + shared.debugArray(numbers));

        let operators = shared.extractOperators(expression);
        this.handleDoubleOperators(numbers, operators);
        this.handleFirstCharOperator(numbers, operators, expression);
        Logger.debug("Operators:" + shared.debugArray(operators));

        let functions = shared.extractFunctions(expression, functionParameterMarkers);
        Logger.debug("Functions:" + shared.debugArray(functions));

        [numbers, operators] = await this.solveFunctions(numbers, operators, functions, functionParameterMarkers, expression);

        Logger.debug("almost final numbers arr:" + shared.debugArray(numbers));
        await this.solveOperations(numbers, operators);

        Logger.debug("final numbers arr:" + shared.debugArray(numbers));

        return numbers.pop()[0];
    }

    async processSubExpression(expression) {
        Logger.debug("=== SubExpression iteration " + expression + " ===");

        if (shared.isSeparator(expression.charAt(0)) && shared.getCloseMarkerIndex(0, expression) == (expression.length - 1)) {
            expression = expression.substring(1, expression.length - 1);
            Logger.debug("(Sub)Expression without markers: " + expression);
        }

        let functionParameterMarkers = this.retrieveFunctionParameterMarkers(expression);
        Logger.debug("functionParameterMarkers: " + shared.debugArray(functionParameterMarkers));
        let subexpressionaMarkers = [...expression].map((expressionChar, index) => (!functionParameterMarkers.includes(index) && shared.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);

        while (subexpressionaMarkers && subexpressionaMarkers.length > 0) {
            Logger.debug("subexpressionMarkers:" + subexpressionaMarkers.toString());

            const openMarkerIndex = subexpressionaMarkers[0];
            const closeMarkerIndex = shared.getCloseMarkerIndex(openMarkerIndex, expression);
            const subExpresion = expression.substring(openMarkerIndex, closeMarkerIndex + 1);

            Logger.debug("subexpresion:" + subExpresion);
            const partialResult = await this.processSubExpression(subExpresion);
            Logger.debug("Partial Result:" + partialResult);

            Logger.debug("before update expression:" + expression);
            expression = expression.replace(subExpresion, partialResult);
            Logger.debug("updated expression:" + expression);

            Logger.debug("before update subexpressionMarkers:" + subexpressionaMarkers);
            Logger.debug("openMarkerIndex:" + openMarkerIndex);
            Logger.debug("closeMarkerIndex:" + closeMarkerIndex);
            const expressionLengthDiff = (closeMarkerIndex - openMarkerIndex) - partialResult.toString().length + 1;
            Logger.debug("expressionLengthDiff:" + expressionLengthDiff);
            subexpressionaMarkers = subexpressionaMarkers.filter(value => value < openMarkerIndex || value > closeMarkerIndex).map(value => value - expressionLengthDiff);
            Logger.debug("updated subexpressionMarkers:" + subexpressionaMarkers);
        }

        functionParameterMarkers = this.retrieveFunctionParameterMarkers(expression);

        return this.solve(expression, functionParameterMarkers);
    }

    async process(req) {

        Logger.debug("============ Started process ============");
        Logger.debug("Original expression: " + req.query);

        const query = shared.formatWithImplicitOperators(req.query);
        Logger.debug("Formatted expression : " + query);

        const finalResult = await this.processSubExpression(query);
        Logger.debug("Final result:" + finalResult);

        return finalResult;
    }
}

export default MathExpression;
