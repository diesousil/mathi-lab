export const operationsPriorityOrder = [['!','%'],['^'], ['*','/'], ['+','-']];

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