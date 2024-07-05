import {jest} from '@jest/globals';
import MathExpression from "../src/input/MathExpression";

let mathExpression = new MathExpression();

let expressionsToTest = [
    ["log(4,2)",2],
    ["root(8,3)",2],
    //["root(8,log(27,3))",2]
];

for(let i=0;i<expressionsToTest.length;i++) {
    let tuple = expressionsToTest[i];

    test("Expresion "+tuple[0]+" = " + tuple[1], async () => {
        const data = await mathExpression.process({ query: tuple[0]});
        expect(data).toBe(tuple[1]);
    });
}