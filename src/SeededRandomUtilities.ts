import {ISeededRandomUtilities} from './ISeededRandomUtilities';
import Rand, {PRNG} from 'rand-seed';

export {PRNG};

const zero = 0;
const one = 1;
const fiftyPercent = 0.5;

export default class SeededRandomUtilities implements ISeededRandomUtilities {

   private randomGenerator: Rand;
   private readonly randomCharPool: string =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
      + '0123456789~!@#$%^&()*_+-={}[]';

   public constructor(seed?: string | Rand, prng: PRNG = PRNG.sfc32) {
       if (seed && seed instanceof Rand) {
           this.randomGenerator = seed;
           return;
       }

       this.randomGenerator = new Rand(seed as string, prng);
   }

   // Some functions adapte to Typescript from Mozilla's web docs:
   // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random

   public random(): number {
       return this.randomGenerator.next();
   }

   public getRandom(): number {
       return this.random();
   }

   public getRandomIntegar(max: number, min = zero): number {
       const minCeil = Math.ceil(min);
       const maxFloor = Math.floor(max);
       return Math.floor(this.random() * (maxFloor - minCeil)) + minCeil;
   }

   public getRandomArbitrary(max: number, min = zero): number {
       return this.random() * (max - min) + min;
   }

   public getRandomIntInclusive(max: number, min = zero): number {
       const minCeil = Math.ceil(min);
       const maxFloor = Math.floor(max);
       return Math.floor(this.random() * (maxFloor - minCeil + one)) + minCeil;
   }

   public generateRandomArrayOfUniqueIntegers(
       amount: number,
       maxValue: number,
       skipShuffle = false
   ): number[] {
       if (amount < zero) {
           throw new Error('Parameter amount cannot be negative');
       }

       const uniqueConsecutiveNumbers: number[] = [];

       for (let index = 0; index <= maxValue; index++) {
           uniqueConsecutiveNumbers.push(index);
       }

       if (!skipShuffle) {
           this.shuffle(uniqueConsecutiveNumbers, false);
       }

       return this.selectUniqueRandomElements(uniqueConsecutiveNumbers, amount);
   }

   public selectRandomElement<T>(source: T[]): T {
       if (!source) {
           throw new Error('Parameter source is not set');
       }

       return this.selectUniqueRandomElements<T>(source, one)[zero];
   }

   // Inspired by npm package shuffle-arr
   // https://github.com/mock-end/shuffle-arr/blob/master/index.js
   public shuffle<T>(array: T[], copy = true): T[]|string {
       if (!array) {
           return array;
       }

       // Copy array or use parameter
       const isAString = typeof array === 'string';
       const result = copy || isAString
           ? [].slice.call(array)
           : array;

       let {length} = array;
       let random;
       let temp;

       while (length) {
           random = Math.floor(this.random() * length);
           length -= one;

           temp = result[length];
           result[length] = result[random];
           result[random] = temp;
       }

       return isAString ? result.join('') : result;
   }

   public selectUniqueRandomElements<T>(source: T[], picks: number): T[] {
       if (!source) {
           throw new Error('Parameter source is not set');
       }

       if (picks < zero) {
           throw new Error('Parameter picks cannot be negative');
       }

       const {length} = source;

       const result = [];

       let remainingPicks = picks;

       for (let iii = 0; iii < length; iii++) {
           if (remainingPicks === zero) {
               break;
           }

           const remainingItems = length - iii;

           if (remainingItems < one) {
               break;
           }

           const isSelected = this.chooseBooleanRandomlyWithProbability(
               remainingItems,
               remainingPicks
           );

           if (isSelected) {
               result.push(source[iii]);
               remainingPicks--;
           }
       }

       return result;
   }

   public chooseBooleanRandomlyWithProbability(
       itemCount: number,
       picks = one
   ): boolean {
       return this.randomGenerator.next() * itemCount < picks;
   }

   // Some functions adapted to TypeScript and seeding from https://www.npmjs.com/package/random-utility
   public getRandomBool(): boolean {
       return this.random() >= fiftyPercent;
   }

   public getRandomChar(): string {
       const randomInt = this.getRandomIntegar(this.randomCharPool.length);

       return this.randomCharPool.charAt(randomInt);
   }

}
