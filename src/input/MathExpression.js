import InputMethod from "./InputMethod.js";
import Logger from "../common/Logger.js";
import {operationsPriorityOrder, orderMarkers} from "../data/shared.js"

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

    async solve(expression) {

        let numbers = [...expression.matchAll(/\d+/g)].map((num) => parseInt(num));
        let operators = [...expression.matchAll(/\D+/g)].map((operator) => operator.toString());

        this.handleDoubleOperators(operators, numbers);
        
        Logger.log("\nNumbers:" + numbers.toString());
        Logger.log("Operators:" + operators.toString());


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

        return numbers.pop();
    }

    getCloseMarkerIndex(openMarkerIndex, expression) {
        let openMarker = expression.charAt(openMarkerIndex);
        let closeMarker = orderMarkers[openMarker];

        return expression.indexOf(closeMarker, openMarkerIndex);
    }

    async processSubExpression(expression) {
        let regEx = new RegExp("\\{|\\[|\\]|\\(|\\)|\\}","");

        if(regEx.test(expression.charAt(0))) {
            expression = expression.substring(1,expression.length-1);
            Logger.log("(Sub)Expression without markers: " + expression);
        }

        let subexpressionSeparators = [...expression].map((element, index) => (regEx.test(element) ? index:undefined)).filter(x => x != undefined);

        while(subexpressionSeparators != undefined && subexpressionSeparators.length > 0) {
            Logger.log("\n\nsubexpressionSeparators:" + subexpressionSeparators.toString());

            let openMarkerIndex = subexpressionSeparators[0];
            let closeMarkerIndex = this.getCloseMarkerIndex(openMarkerIndex, expression);            
            let subExpresion = expression.substring(openMarkerIndex, closeMarkerIndex+1);

            Logger.log("subexpresion:" + subExpresion);
            let partialResult = await this.processSubExpression(subExpresion);
            Logger.log("Partial Result:" + partialResult);

            Logger.log("before update expresion:" + expression);
            expression = expression.replace(subExpresion, partialResult);
            Logger.log("updated expresion:" + expression);

            Logger.log("before update subexpressionSeparators:" + subexpressionSeparators);
            let expresionLengthDiff = (closeMarkerIndex-openMarkerIndex) - partialResult.toString().length + 1;
            subexpressionSeparators = subexpressionSeparators.filter((value) => value < openMarkerIndex || value > closeMarkerIndex).map(value => value - expresionLengthDiff);
            Logger.log("updated subexpressionSeparators:" + subexpressionSeparators);
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
        //|\\d+{|\\)\\d+|\\]\\d+|\\d+\\}
        let ereg = new RegExp("\\d+\\(|\\d+\\[|\\d+\\{","g");
        let indexes = [...query.matchAll(ereg)].map(a => a.index);

        if(indexes != undefined && indexes.length > 0) {
            Logger.log("Multiplication without symbol to replace:" + indexes.toString()); 

            for(let i=0;i<indexes.length; i++) {
                let pos = indexes[i];
                while(this.isNumericChar(query.charAt(pos))) {
                    pos+=1;
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