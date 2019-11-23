
const SeededRandomUtilities = require('seeded-random-utilities').default;

const rand = new SeededRandomUtilities("1234");
const totals = {};
for(let index = 0; index < 50000; index++){
      const results = rand.generateRandomArrayOfUniqueIntegers(3, 9);
      const [one, two, three] = results;

      const setKey = one.toString() + two.toString() + three.toString();
      totals[setKey] 
            ? totals[setKey]++
            : totals[setKey] = 1;

      console.log(results);
}

console.log(totals);