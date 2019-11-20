const SeededRandomUtilities = require('../dist/seeded-random-utilities').default;

let rand = new SeededRandomUtilities('1234');
const result1 = Array.from({length: 10}, () => rand.random());

rand = new SeededRandomUtilities('1234');
const result2 = Array.from({length: 10}, () => rand.random());

console.log('RESULT1:', result1);
console.log('RESULT2:', result2);
console.log('RESULT1 == RESULT2:', JSON.stringify(result1) === JSON.stringify(result2));
