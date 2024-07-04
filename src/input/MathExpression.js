import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import {
    operationsPriorityOrder,
    orderMarkers,
    allMarkers,
    closeMarkers,
    isNumberRegex,
    isOperatorRegex,
    isFunctionRegex,
    debugArray
} from "../data/shared.js";

class MathExpression extends InputMethod {
    constructor() {
        super();
    }

    handleDoubleOperators(numbers, operators) {
        const doubleOperators = operators.map((operator, index) => operator[0].length > 1 ? index : undefined).filter(x => x != undefined);

        if (doubleOperators && doubleOperators.length > 0) {
            Logger.log("doubleOperators:" + debugArray(doubleOperators));

            doubleOperators.forEach(index => {
                numbers[index + 1][0] = parseInt(operators[index][0].charAt(1) + "1") * numbers[index + 1][0];
                operators[index][0] = operators[index][0].charAt(0);
            });

            Logger.log("doubleOperators updated numbers:" + debugArray(numbers));
            Logger.log("doubleOperators updated operators:" + debugArray(operators));
        }
    }

    handleFirstCharOperator(numbers, operators, expression) {
        const isFirstCharOperator = (expression.charAt(0).match(isOperatorRegex) != null);
        Logger.log("First exp char:" + expression.charAt(0) + " <- is operator ? -> " + isFirstCharOperator);
        if (isFirstCharOperator) {
            operators.splice(0, 1);
            numbers[0][0] *= parseInt(expression.charAt(0) + "1");
            Logger.log("\nChanged Numbers:" + debugArray(numbers));
            Logger.log("Changed Operators:" + debugArray(operators));
        }
    }

    async solveFunctions(numbers, functions) {
        for (let i = 0; i < functions.length; i++) {
            const functionName = functions[i];
            Logger.log("trying to load function: " + functionName[0]);

            const paramsQty = await this.retrieveParamsCount(functionName[0]);
            Logger.log("function param count:" + paramsQty);

            const selectedNumbers = numbers.filter(x => x[1] > functions[1]).slice(0, paramsQty);
            const params = selectedNumbers.map(x => x[0]);
            Logger.log("function " + functionName[0] + " params:" + debugArray(params));

            const result = await this.callMathFunction(params);
            this.resetMathFunction();

            numbers.splice(0, 0, [result, functionName[1]]);
            Logger.log("updated numbers after function " + functionName[0] + ":" + debugArray(numbers));
        }
    }

    async solveOperations(numbers, operators) {
        while (operators.length > 0) {
            for (let i = 0; i < operationsPriorityOrder.length; i++) {
                const operationsToCheck = operationsPriorityOrder[i];
                Logger.log("\operationsToCheck: " + operationsToCheck.toString());

                let occurrences = [];
                do {
                    occurrences = operators.map((element, index) => operationsToCheck.includes(element[0][0]) ? index : undefined).filter(x => x != undefined);

                    if (occurrences && occurrences.length > 0) {
                        Logger.log("Occurrences: " + occurrences.toString());

                        const opIndex = occurrences[0];
                        const operator = operators[opIndex][0];
                        const paramsQty = await this.retrieveParamsCount(operator);
                        const params = numbers.slice(opIndex, opIndex + paramsQty).map(x => 1 * x[0]);

                        Logger.log("Operator: " + operator + " params count: " + paramsQty);
                        Logger.log("\nProcessing: " + operator + " with params " + debugArray(params));
                        const result = await this.callMathFunction(params);
                        Logger.log("Result: " + result);
                        this.resetMathFunction();

                        numbers[opIndex][0] = result;
                        numbers.splice(opIndex + 1, paramsQty - 1);
                        operators.splice(opIndex, 1);

                        Logger.log("\n\nUpdated Operators array: " + debugArray(operators));
                        Logger.log("Updated Numbers array: " + debugArray(numbers));
                    }
                } while (occurrences.length > 0);
            }
        }
    }

    extract(expression, regex) {
        const extractedSymbols = [];
        let match;
        while ((match = regex.exec(expression)) !== null) {
            extractedSymbols.push([match[0], match.index]);
        }
        return extractedSymbols;
    }

    extractNumbers(expression) {
        return this.extract(expression, isNumberRegex);
    }

    extractOperators(expression) {
        return this.extract(expression, isOperatorRegex);
    }

    extractFunctions(expression) {
        return this.extract(expression, isFunctionRegex);
    }

    async solve(expression) {
        let numbers = this.extractNumbers(expression);
        Logger.log("\nNumbers:" + debugArray(numbers));

        let operators = this.extractOperators(expression);
        this.handleDoubleOperators(numbers, operators);
        this.handleFirstCharOperator(numbers, operators, expression);
        Logger.log("Operators:" + debugArray(operators));

        const functions = this.extractFunctions(expression);
        Logger.log("Functions:" + debugArray(functions));

        await this.solveFunctions(numbers, functions);
        await this.solveOperations(numbers, operators);

        return numbers.pop()[0];
    }

    getCloseMarkerIndex(openMarkerIndex, expression) {
        const openMarker = expression.charAt(openMarkerIndex);
        const closeMarker = orderMarkers[openMarker];
        return expression.indexOf(closeMarker, openMarkerIndex);
    }

    isSeparator(charValue) {
        return (allMarkers.indexOf(charValue) >= 0);
    }

    async processSubExpression(expression) {
        Logger.log("\n\n=== SubExpression iteration " + expression + " ===");

        if (this.isSeparator(expression.charAt(0)) && this.getCloseMarkerIndex(0, expression) == (expression.length - 1)) {
            expression = expression.substring(1, expression.length - 1);
            Logger.log("(Sub)Expression without markers: " + expression);
        }

        let subexpressionallMarkers = [...expression].map((expressionChar, index) => (this.isSeparator(expressionChar) ? index : undefined)).filter(x => x != undefined);

        while (subexpressionallMarkers && subexpressionallMarkers.length > 0) {
            Logger.log("\n\nsubexpressionallMarkers:" + subexpressionallMarkers.toString());

            const openMarkerIndex = subexpressionallMarkers[0];
            const closeMarkerIndex = this.getCloseMarkerIndex(openMarkerIndex, expression);
            const subExpresion = expression.substring(openMarkerIndex, closeMarkerIndex + 1);

            Logger.log("subexpresion:" + subExpresion);
            const partialResult = await this.processSubExpression(subExpresion);
            Logger.log("Partial Result:" + partialResult);

            Logger.log("before update expression:" + expression);
            expression = expression.replace(subExpresion, partialResult);
            Logger.log("updated expression:" + expression);

            Logger.log("before update subexpressionallMarkers:" + subexpressionallMarkers);
            const expressionLengthDiff = (closeMarkerIndex - openMarkerIndex) - partialResult.toString().length + 1;
            subexpressionallMarkers = subexpressionallMarkers.filter(value => value < openMarkerIndex || value > closeMarkerIndex).map(value => value - expressionLengthDiff);
            Logger.log("updated subexpressionallMarkers:" + subexpressionallMarkers);
        }

        return this.solve(expression);
    }

    isNumericChar(chr) {
        const result = (chr.charCodeAt(0) >= "0".charCodeAt(0) && chr.charCodeAt(0) <= "9".charCodeAt(0));
        Logger.log("chr:" + chr);
        Logger.log("is digit?" + result);
        return result;
    }

    formatQuery(query) {
        const ereg = new RegExp("\\d+\\(|\\d+\\[|\\d+\\{|\\)\\(", "g");
        let indexes = [...query.matchAll(ereg)].map(a => a.index);

        if (indexes && indexes.length > 0) {
            Logger.log("Multiplication without symbol to replace:" + indexes.toString());

            for (let i = 0; i < indexes.length; i++) {
                let pos = indexes[i];
                let wasFirstChar = true;
                while (this.isNumericChar(query.charAt(pos)) || (wasFirstChar && closeMarkers.indexOf(query.charAt(pos)) >= 0)) {
                    pos += 1;
                    wasFirstChar = false;
                }

                query = query.substring(0, pos) + "*" + query.substring(pos);
                indexes = indexes.map(value => value + 1);
            }
        }

        return query;
    }

    async process(req) {
        Logger.log("\n\n============ Started process ============");
        Logger.log("Original expression: " + req.query);
        const query = this.formatQuery(req.query).toLowerCase();
        Logger.log("Expression after format: " + query);

        const finalResult = await this.processSubExpression(query);
        Logger.log("\n\nFinal result:" + finalResult);

        return finalResult;
    }
}

export default MathExpression;
