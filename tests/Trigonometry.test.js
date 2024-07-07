import {jest} from '@jest/globals';
import MathExpression from "../src/input/MathExpression";

let mathExpression = new MathExpression();

let expressionsToTest = [
    ["Pi*2", Math.PI*2],
    ["Pi*2^2", Math.PI*4],
    ["cos(PI)", -1],
    ["cos(PI)+2*5", 9],
    ["cos(PI)/sin(PI)", Math.tan(Math.PI)],
    ["tan(PI)", Math.tan(Math.PI)],
    ["sin({10*[2.4/(4+8)]}*PI)", Math.sin(2*Math.PI)]
];

for(let i=0;i<expressionsToTest.length;i++) {
    let tuple = expressionsToTest[i];

    test("Expresion "+tuple[0]+" = " + tuple[1], async () => {
        const data = await mathExpression.process({ query: tuple[0]});
        expect(data - tuple[1] < 0.0001).toBeTruthy();
    });
}