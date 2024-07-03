import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import {operationsPriorityOrder, orderMarkers, allMarkers, closeMarkers, isNumberRegex, isOperatorRegex} from "../data/shared.js"

class MathExpression extends InputMethod {

    constructor() {
        super();
    }


    handleDoubleOperators(operators, numbers) {

        let doubleOperators = operators.map((operator, index) => operator.length > 1 ? index: undefined).filter(x => x != undefined);

        if(doubleOperators != undefined && doubleOperators.length > 0) {
            Logger.log("doubleOperators:" + doubleOperators.toString());

            doubleOperators.forEach(index => {
                numbers[index+1] = parseInt(operators[index].charAt(1) + "1") * numbers[index+1];
                operators[index] = operators[index].charAt(0);
            }, this);
    
            Logger.log("doubleOperators updated numbers:" + numbers.toString());
            Logger.log("doubleOperators updated operators:" + operators.toString());            
        }

    }

    handleFirstCharOperator(numbers, operators, expression) {

        let isFirstCharOperator = (expression.charAt(0).match(isOperatorRegex) != null);
        Logger.log("First exp char:" + expression.charAt(0) + " <- is operator ? -> " + isFirstCharOperator);
        if(isFirstCharOperator) {
            operators.splice(0, 1);
            numbers[0] *= parseInt(expression.charAt(0) + "1");
            Logger.log("\nChanged Numbers:" + numbers.toString());
            Logger.log("Changed Operators:" + operators.toString());
        }

    }

    async solve(expression) {

        let numbers = [...expression.matchAll(isNumberRegex)].map((num) => parseFloat(num));
        Logger.log("\nNumbers:" + numbers.toString());

        let operators = [...expression.matchAll(isOperatorRegex)].map((operator) => operator.toString());
        this.handleDoubleOperators(operators, numbers);
        Logger.log("Operators:" + operators.toString());

        this.handleFirstCharOperator(numbers, operators, expression);

        while(operators.length > 0) {

            for(let i=0;i<operationsPriorityOrder.length;i++) {

                let operationsToCheck = operationsPriorityOrder[i];

                Logger.log("\operationsToCheck: " + operationsToCheck.toString());
                let ocurrences = [];

                do {
                    
                    ocurrences = operators.map((element, index) => operationsToCheck.includes(element[0])? index : undefined).filter(x => x!= undefined);

                    if(ocurrences != undefined && ocurrences.length > 0) {
                        Logger.log("Ocurrences: " + ocurrences.toString());
                        
                        let opIndex = ocurrences[0];
                        let operator = operators[opIndex];
                        let n1 = numbers[opIndex];
                        let n2 = numbers[opIndex+1];
                        Logger.log("\nProcessing: " + n1 + " " + operator + " " + n2)
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

        return numbers.pop();
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
        Logger.log("\n\n============ processSubExpression iteration " + expression + " ============");

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

        Logger.log("Original expression: " + req.query);
        let query = this.formatQuery(req.query);
        Logger.log("Expression after format: " + query);

        const finalResult = await this.processSubExpression(query)

        const endDateTime = Date.now();
        Logger.log("\n\nFinal result:" + finalResult);

        return finalResult;
    }



}

export default MathExpression;