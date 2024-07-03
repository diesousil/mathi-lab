import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import {operationsPriorityOrder, 
        orderMarkers, 
        allMarkers, 
        closeMarkers, 
        isNumberRegex, 
        isOperatorRegex,
        isFunctionRegex,
        debugArray} from "../data/shared.js"

class MathExpression extends InputMethod {

    constructor() {
        super();
    }


    handleDoubleOperators(numbers, operators) {

        let doubleOperators = operators.map((operator, index) => operator[0].length > 1 ? index: undefined).filter(x => x != undefined);

        if(doubleOperators != undefined && doubleOperators.length > 0) {
            Logger.log("doubleOperators:" + debugArray(doubleOperators));

            doubleOperators.forEach(index => {
                numbers[index+1][0] = parseInt(operators[index][0].charAt(1) + "1") * numbers[index+1][0];
                operators[index][0] = operators[index][0].charAt(0);
            }, this);
    
            Logger.log("doubleOperators updated numbers:" + debugArray(numbers));
            Logger.log("doubleOperators updated operators:" + debugArray(operators));            
        }

    }

    handleFirstCharOperator(numbers, operators, expression) {

        let isFirstCharOperator = (expression.charAt(0).match(isOperatorRegex) != null);
        Logger.log("First exp char:" + expression.charAt(0) + " <- is operator ? -> " + isFirstCharOperator);
        if(isFirstCharOperator) {
            operators.splice(0, 1);
            numbers[0][0] *= parseInt(expression.charAt(0) + "1");
            Logger.log("\nChanged Numbers:" + debugArray(numbers));
            Logger.log("Changed Operators:" + debugArray(operators));
        }

    }

    async solveFunctions(numbers, functions) {
        
        for(let i=0;i<functions.length;i++) {
            let functionName = functions[i];
            Logger.log("trying to load function: " + functionName[0]);

            let paramsQty = await this.retrieveParamsCount(functionName[0]);

            Logger.log("function param count:" + paramsQty);
            
            let selectedNumbers = numbers.filter( x => x[1] > functions[1]).slice(0, paramsQty);

            let params = selectedNumbers.map(x => x[0]);
            Logger.log("function "+functionName[0]+" params:" + debugArray(params));
            const result = await this.callMathFunction(params);
            this.resetMathFunction();

            numbers.splice(0,0,[result, functionName[1]]);
            Logger.log("updated numbers after function "+functionName[0]+":" + debugArray(numbers));
            
        }

    }

    async solveOperations(numbers, operators) {

        while(operators.length > 0) {

            for(let i=0;i<operationsPriorityOrder.length;i++) {

                let operationsToCheck = operationsPriorityOrder[i];

                Logger.log("\operationsToCheck: " + operationsToCheck.toString());
                let ocurrences = [];

                do {                    
                    ocurrences = operators.map((element, index) => operationsToCheck.includes(element[0][0])? index : undefined).filter(x => x!= undefined);

                    if(ocurrences != undefined && ocurrences.length > 0) {
                        Logger.log("Ocurrences: " + ocurrences.toString());

                        let opIndex = ocurrences[0];
                        let operator = operators[opIndex][0];
                        let paramsQty = await this.retrieveParamsCount(operator);
                        let params = numbers.slice(opIndex, opIndex+paramsQty).map(x => 1*x[0]);

                        Logger.log("Operator: " + operator + " params count: " + paramsQty);
                        Logger.log("\nProcessing: " + operator + " with params " + debugArray(params));
                        const result = await this.callMathFunction(params);
                        Logger.log("Result: " + result)
                        this.resetMathFunction();

                        numbers[opIndex][0] = result;
                        numbers.splice(opIndex+1, paramsQty-1);
                        operators.splice(opIndex, 1);
                        
                        Logger.log("\n\nUpdated Operators array: " + debugArray(operators));
                        Logger.log("Updated NUmbers array: " + debugArray(numbers));
                    }
    

                } while(ocurrences.length > 0);

            }
        }
    }


    extract(expression, regex) {
        let extractedSymbols = [];
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

        let functions = this.extractFunctions(expression);
        Logger.log("Functions:" + debugArray(functions));

        await this.solveFunctions(numbers, functions);
        await this.solveOperations(numbers, operators);

        return numbers.pop()[0];
    }

    getCloseMarkerIndex(openMarkerIndex, expression) {
        let openMarker = expression.charAt(openMarkerIndex);
        let closeMarker = orderMarkers[openMarker];

        return expression.indexOf(closeMarker, openMarkerIndex);
    }

    isSeparator(charValue) {
        return (allMarkers.indexOf(charValue)>=0);
    }

    async processSubExpression(expression) {
        Logger.log("\n\n=== SubExpression iteration " + expression + " ===");

        if(this.isSeparator(expression.charAt(0)) && this.getCloseMarkerIndex(0, expression) == (expression.length-1)) {
            expression = expression.substring(1,expression.length-1);
            Logger.log("(Sub)Expression without markers: " + expression);
        }
        
        let subexpressionallMarkers = [...expression].map((expressionChar, index) => (this.isSeparator(expressionChar) ? index:undefined)).filter(x => x != undefined);

        while(subexpressionallMarkers != undefined && subexpressionallMarkers.length > 0) {
            Logger.log("\n\nsubexpressionallMarkers:" + subexpressionallMarkers.toString());

            let openMarkerIndex = subexpressionallMarkers[0];
            let closeMarkerIndex = this.getCloseMarkerIndex(openMarkerIndex, expression);
            let subExpresion = expression.substring(openMarkerIndex, closeMarkerIndex+1);

            Logger.log("subexpresion:" + subExpresion);
            let partialResult = await this.processSubExpression(subExpresion);
            Logger.log("Partial Result:" + partialResult);

            Logger.log("before update expresion:" + expression);
            expression = expression.replace(subExpresion, partialResult);
            Logger.log("updated expresion:" + expression);

            Logger.log("before update subexpressionallMarkers:" + subexpressionallMarkers);
            let expresionLengthDiff = (closeMarkerIndex-openMarkerIndex) - partialResult.toString().length + 1;
            subexpressionallMarkers = subexpressionallMarkers.filter((value) => value < openMarkerIndex || value > closeMarkerIndex).map(value => value - expresionLengthDiff);
            Logger.log("updated subexpressionallMarkers:" + subexpressionallMarkers);
        }   
        
        return this.solve(expression);
    }

    isNumericChar(chr) {

        let result = (chr.charCodeAt(0) >= "0".charCodeAt(0) && chr.charCodeAt(0) <= "9".charCodeAt(0));
        Logger.log("chr:" + chr);
        Logger.log("is digit?" + result);
        return result;
    }

    formatQuery(query) {
        let ereg = new RegExp("\\d+\\(|\\d+\\[|\\d+\\{|\\)\\(","g");
        let indexes = [...query.matchAll(ereg)].map(a => a.index);

        if(indexes != undefined && indexes.length > 0) {
            Logger.log("Multiplication without symbol to replace:" + indexes.toString()); 

            for(let i=0;i<indexes.length; i++) {
                let pos = indexes[i];
                let wasFirstChar = true;
                while(this.isNumericChar(query.charAt(pos)) || (wasFirstChar && closeMarkers.indexOf(query.charAt(pos)) >= 0)) {
                    pos+=1;
                    wasFirstChar = false;
                }

                query = query.substring(0, pos) + "*" + query.substring(pos);
                indexes = indexes.map((value) => value + 1);
            }
        }

        return query;

    }

    async process(req) {

        Logger.log("\n\n============ Started process ============");
        Logger.log("Original expression: " + req.query);
        let query = this.formatQuery(req.query).toLowerCase();
        Logger.log("Expression after format: " + query);

        const finalResult = await this.processSubExpression(query)

        Logger.log("\n\nFinal result:" + finalResult);

        return finalResult;
    }

}

export default MathExpression;