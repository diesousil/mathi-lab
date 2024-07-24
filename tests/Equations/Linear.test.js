import {jest} from '@jest/globals';
import Equation from "../../src/input/Equation";

let equation = new Equation();

let expressionsToTest = [
    ["x+5=10",5],
    ["x-5=10",15],
    ["2*x+5=10",2.5],
    ["12*x-75=0",6.25],
    ["2(68x-37.5)=0", 6.25]
];

for(let i=0;i<expressionsToTest.length;i++) {
    let tuple = expressionsToTest[i];

    test("Equation "+tuple[0]+" solution should be " + tuple[1], async () => {
        const data = await equation.process({ query: tuple[0]});
        expect(data - tuple[1] < 0.0001).toBeTruthy();
    });
}