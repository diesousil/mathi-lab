import Logger from '../common/Logger.js';

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

export const operationsPriorityOrder = [['!','%'],['^'], ['*','/'], ['+','-']];

export const orderMarkers = {
    '{' : '}',
    '[' : ']',
    '(' : ')'
};

export const inverseOperator = {
    '-' : '+',
    '+' : '-',
    '*' : '/',
    '/' : '*'
};

export const openMarkers = "{[(";
export const closeMarkers = ")]}";
export const allMarkers = openMarkers + closeMarkers;

export const isNumberRegex = /([0-9]+)([.][0-9]+)?/g;
export const isOperatorRegex = /(?:(?=[^.A-Za-z\(\)])[\D])/g;
export const isFunctionRegex = /([a-z]+)/g;
export const isFunctionWithParameterRegex = /[a-z]+\(/g;
export const isVariableRegex = /(?<![a-zA-Z])[a-z](?![a-zA-Z])/g;

export function splitOutsideParentheses(input) {

    let regex = /,|(\([^()]*\))/g;
    let matches = input.match(regex);

    if (!matches) {
        return [input];
    }

    let result = [];
    let lastIndex = 0;
    let splitPositions = [];

    for (let match of matches) {
        let index = input.indexOf(match, lastIndex);

        if (match.startsWith('(')) {            
            lastIndex = index + match.length;
            continue;
        } else {
            splitPositions.push(index);
            lastIndex = index + match.length;
        }
    }

    lastIndex = 0;
    for (let pos of splitPositions) {
        result.push(input.slice(lastIndex, pos));
        lastIndex = pos + 1;
    }
    result.push(input.slice(lastIndex)); // Add the last segment

    return result;
}

export function retrieveNumberBeforePosition(expression, index) {
    let number = "";

    let chrToTest = expression.charAt(--index);    
    while (isNumericChar(chrToTest) || chrToTest == ".") {
        number = chrToTest + number;
        chrToTest = expression.charAt(--index);
    }

    return [parseFloat(number), index+1];
}

export function retrieveVariableBeforePosition(expression, index) {
    let chr = "";

    let chrToTest = expression.charAt(--index);    

    if (isLetter(chrToTest))
        chr = chrToTest; 

    return [chr, index];
}

export function retrievePreviousFactor(expression, index) {
    let [result, resultIndex] = retrieveNumberBeforePosition(expression, index);

    if(!isNumberRegex.test(result)) {
        [result, resultIndex] = retrieveVariableBeforePosition(expression, index);
    }

    return [result, resultIndex];
}

export function containsVariables(expression) {

    return extract(expression, isVariableRegex).length > 0;
}

export function containsOperators(expression) {

    return extract(expression, isOperatorRegex).length > 0;
}


/**
 * For a given expression, obtains internal elements identified by the given regular expression.
 * @param {*} expression 
 * @param {*} regex 
 * @returns array with the extracted elements
 */
export function extract(expression, regex) {
    const extractedSymbols = [];
    let match;
    regex.lastIndex = 0;
    while ((match = regex.exec(expression)) !== null) {
        extractedSymbols.push([match[0], match.index]);
    }
    return extractedSymbols;
}

export function extractNumbers(expression) {
    return this.extract(expression, isNumberRegex);
}

export function extractVariables(expression) {
    return this.extract(expression, isVariableRegex);
}

export function extractOperators(expression) {
    return this.extract(expression, isOperatorRegex);
}

export function extractFunctions(expression, functionParameterMarkers) {
    let functions = this.extract(expression, isFunctionRegex);
    let extractedFunctions = [];

    for(let i=0;i<functions.length;i++) {
        let isSubfunction = false;
        let testedFunction = functions[i];

        Logger.debug(testedFunction[0] + " is a subfunction?");

        for(let j=0;functionParameterMarkers[j] < testedFunction[1];j+=2) {
            if(testedFunction[1] > functionParameterMarkers[j] && testedFunction[1] < functionParameterMarkers[j+1]) {
                Logger.debug("yes");
                isSubfunction = true;
            }
        }

        if(!isSubfunction) {
            Logger.debug("no");
            extractedFunctions.push(testedFunction);
        }
    }

    return extractedFunctions;
}

export function debugArray(arrayVar) {
    return JSON.stringify(arrayVar);
}

export function removeSpaces(str) {
    return str.replace(/\s+/g, '');
}

export function isNumericChar(chr) {
    const result = (chr.charCodeAt(0) >= "0".charCodeAt(0) && chr.charCodeAt(0) <= "9".charCodeAt(0));
    return result;
}
export function isLetter(chr) {
    return isVariableRegex.test(chr);
}


export function isSeparator(charValue) {
    return (allMarkers.indexOf(charValue) >= 0);
}

export function getCloseMarkerIndex(openMarkerIndex, expression) {
    const openMarker = expression.charAt(openMarkerIndex);
    const closeMarker = orderMarkers[openMarker];
    return expression.indexOf(closeMarker, openMarkerIndex);
}

/**
 * It expected for mathematical expressions some operators to be ommited. For example, for the expression 2x+5, there's a hidden multiply operator
 * between 2 and x. The same happens between the close and open parenthesis on (2+5)(10+2) expression. This method make this operators explicit before
 * the expression can be solved.
 * @param {*} mathExpression mathematical expression
 * @returns changed expressions with the previous hiddden operators made explicit
 */
export function formatWithImplicitOperators(mathExpression) {

    const expressions= [
        "\\d+\\(",
        "\\d+\\[",
        "\\d+\\{",
        "\\d+[a-zA-Z]",
        "\\)\\(",
        "\\]\\(",
        "\\}\\(",
        "\\)\\[",
        "\\]\\[",
        "\\}\\[",
        "\\)\\{",
        "\\]\\{",
        "\\}\\{"
    ];

    const ereg = new RegExp(expressions.join('|'), "g");
    let indexes = [...mathExpression.matchAll(ereg)].map(a => a.index);

    if (indexes && indexes.length > 0) {

        for (let i = 0; i < indexes.length; i++) {
            let pos = indexes[i];
            let wasFirstChar = true;
            while (isNumericChar(mathExpression.charAt(pos)) || (wasFirstChar && closeMarkers.indexOf(mathExpression.charAt(pos)) >= 0)) {
                pos += 1;
                wasFirstChar = false;
            }

            mathExpression = mathExpression.substring(0, pos) + "*" + mathExpression.substring(pos);
            indexes = indexes.map(value => value + 1);
        }
    }

    return removeSpaces(mathExpression).toLowerCase();
}