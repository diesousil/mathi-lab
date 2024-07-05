export const operationsPriorityOrder = [['!'],['^'], ['*','/'], ['+','-']];

export const orderMarkers = {
    '{' : '}',
    '[' : ']',
    '(' : ')'
};

export const openMarkers = "{[(";
export const closeMarkers = ")]}";
export const allMarkers = openMarkers + closeMarkers;;

export const isNumberRegex = /([0-9]+)([.][0-9]+)?/g;
export const isOperatorRegex = /(?:(?=[^.A-Za-z\(\)])[\D])/g;
export const isFunctionRegex = /([a-z]+)/g;
export const isFunctionWithParameterRegex = /[a-z]+\(/g;
        

export function debugArray(arrayVar) {
    return JSON.stringify(arrayVar);
}

export function removeSpaces(str) {
    return str.replace(/\s+/g, '');
}