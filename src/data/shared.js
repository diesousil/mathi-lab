export const operationsPriorityOrder = [['^','!'], ['*','/'], ['+','-']];

export const orderMarkers = {
    '{' : '}',
    '[' : ']',
    '(' : ')'
};

export const openMarkers = "{[(";
export const closeMarkers = ")]}";
export const allMarkers = openMarkers + closeMarkers;;

export const isNumberRegex = /([0-9]+)([.][0-9]+)?/g;
export const isOperatorRegex = /(?:(?=[^.])[\D])/g;
        