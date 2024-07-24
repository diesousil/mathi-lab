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
export const allMarkers = openMarkers + closeMarkers;;

export const isNumberRegex = /([0-9]+)([.][0-9]+)?/g;
export const isOperatorRegex = /(?:(?=[^.A-Za-z\(\)])[\D])/g;
export const isFunctionRegex = /([a-z]+)/g;
export const isFunctionWithParameterRegex = /[a-z]+\(/g;
export const isVariableRegex = /(?<![a-zA-Z])[a-z](?![a-zA-Z])/g;

export function debugArray(arrayVar) {
    return JSON.stringify(arrayVar);
}

export function removeSpaces(str) {
    return str.replace(/\s+/g, '');
}

// Love you chatgpt
export function splitOutsideParentheses(input) {
    // Match all commas and split positions, excluding those within parentheses
    let regex = /,|(\([^()]*\))/g;
    let matches = input.match(regex);

    if (!matches) {
        return [input]; // No matches, return the input as a single element array
    }

    let result = [];
    let lastIndex = 0;
    let splitPositions = [];

    for (let match of matches) {
        let index = input.indexOf(match, lastIndex);

        if (match.startsWith('(')) {
            // If the match is a parenthesis group, ignore it
            lastIndex = index + match.length;
            continue;
        } else {
            // If the match is a comma, store the position
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

export function extract(expression, regex) {
    const extractedSymbols = [];
    let match;
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

export function isNumericChar(chr) {
    const result = (chr.charCodeAt(0) >= "0".charCodeAt(0) && chr.charCodeAt(0) <= "9".charCodeAt(0));
    Logger.debug("chr:" + chr);
    Logger.debug("is digit?" + result);
    return result;
}

export function formatQuery(query) {
    const ereg = new RegExp("\\d+\\(|\\d+\\[|\\d+\\{|\\)\\(", "g");
    let indexes = [...query.matchAll(ereg)].map(a => a.index);

    if (indexes && indexes.length > 0) {
        Logger.debug("Multiplication without symbol to replace:" + indexes.toString());

        for (let i = 0; i < indexes.length; i++) {
            let pos = indexes[i];
            let wasFirstChar = true;
            while (isNumericChar(query.charAt(pos)) || (wasFirstChar && closeMarkers.indexOf(query.charAt(pos)) >= 0)) {
                pos += 1;
                wasFirstChar = false;
            }

            query = query.substring(0, pos) + "*" + query.substring(pos);
            indexes = indexes.map(value => value + 1);
        }
    }

    return removeSpaces(query).toLowerCase();
}

export function getCloseMarkerIndex(openMarkerIndex, expression) {
    const openMarker = expression.charAt(openMarkerIndex);
    const closeMarker = shared.orderMarkers[openMarker];
    return expression.indexOf(closeMarker, openMarkerIndex);
}

export function isSeparator(charValue) {
    return (shared.allMarkers.indexOf(charValue) >= 0);
}