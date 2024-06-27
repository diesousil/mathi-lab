import {jest} from '@jest/globals';
import MathExpression from "../src/input/MathExpression";

let mathExpression = new MathExpression();

let expressionsToTest = [
    ["2+2",4],
    ["3*(2+2)",12],
    ["200+{100+[5*(3+2)]}-54/12-45*3*2^5",-3999.5]
];

for(let i=0;i<expressionsToTest.length;i++) {
    let tuple = expressionsToTest[i];

    test("Expresion "+tuple[0]+" = " + tuple[1], async () => {
        const data = await mathExpression.process({ query: tuple[0]});
        expect(data).toBe(tuple[1]);
    });
}