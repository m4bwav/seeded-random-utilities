import SeededRandomUtilities, {PRNG} from '../src/SeededRandomUtilities';
import Rand from 'rand-seed';

const someSeedValue = '1234';

const zero = 0;
const one = 1;
const negativeOne = -1;
describe('SeededRandomUtilities', (): void => {
    it('creates a new default instance', (): void => {
        const utilties = new SeededRandomUtilities;

        expect(utilties).toBeInstanceOf(SeededRandomUtilities);
        expect(typeof utilties.random()).toBe('number');
    });

    [
        undefined, // eslint-disable-line no-undefined
        PRNG.sfc32,
        PRNG.mulberry32,
        PRNG.xoshiro128ss
    ].forEach((algo: PRNG | undefined): void => {
        it(`creates a new [${algo}] instance`, (): void => {
            const utilties = new SeededRandomUtilities(someSeedValue, algo);

            expect(utilties).toBeInstanceOf(SeededRandomUtilities);
            expect(typeof utilties.random()).toBe('number');
        });
    });

    it('can produce 3 unique numbers out of 10', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = 3;
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 9;
        const randomArray = utilties
            .generateRandomArrayOfUniqueIntegers(numberOfPicks, maxValue);

        expect(randomArray.length).toBe(numberOfPicks);
        randomArray.forEach((value, index) => {
            expect(typeof value).toBe('number');
            // Check if unique
            expect(randomArray.lastIndexOf(value)).toBe(index);
            expect(value).toBeGreaterThanOrEqual(zero);
            expect(value).toBeLessThanOrEqual(maxValue);
        });
    });

    it('will produce unique numbers until out of uniques', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = 10;
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 3;
        const randomArray = utilties
            .generateRandomArrayOfUniqueIntegers(numberOfPicks, maxValue);

        expect(randomArray.length).toBe(maxValue + one);
    });

    it('throws an error on negative picks', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = -1;
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 3;
        const attempt = (): number[] => utilties
            .generateRandomArrayOfUniqueIntegers(numberOfPicks, maxValue);

        expect(attempt).toThrowError('cannot be negative');
    });

    it('can produce a random bool', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const value = utilties.getRandomBool();

        expect(typeof value).toBe('boolean');
    });

    it('can produce a random inclusive int', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const inclusiveMax = 10;
        const value = utilties.getRandomIntInclusive(inclusiveMax);

        expect(typeof value).toBe('number');
        expect(value).toBeLessThanOrEqual(inclusiveMax);
    });

    it('can produce a random value', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const value = utilties.getRandom();
        expect(typeof value).toBe('number');

        expect(value).toBeGreaterThanOrEqual(zero);
        expect(value).toBeLessThanOrEqual(one);
    });
    it('can produce a arbitary random', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const max = 10;
        const value = utilties.getRandomArbitrary(max);

        expect(typeof value).toBe('number');
        expect(value).toBeLessThanOrEqual(max);
    });

    it('can produce a random char', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const value = utilties.getRandomChar();

        expect(typeof value).toBe('string');
        expect(value.length).toBe(one);
    });

    it('can produce a random element', (): void => {
        const utilties = new SeededRandomUtilities(someSeedValue);
        expect(utilties).toBeInstanceOf(SeededRandomUtilities);

        const limitedArray = ['A', 'B', 'C'];

        const value = utilties.selectRandomElement(limitedArray);

        expect(typeof value).toBe('string');
        expect(limitedArray.indexOf(value)).not.toBe(negativeOne);
    });

    it('returns undefined if there aren\'t any elements to select random from',
        (): void => {
            const utilties = new SeededRandomUtilities(someSeedValue);
            expect(utilties).toBeInstanceOf(SeededRandomUtilities);

            const limitedArray: string[] = [];

            const result = utilties.selectRandomElement(limitedArray);

            expect(result).toBeUndefined();
        });

    [
        PRNG.sfc32,
        PRNG.mulberry32,
        PRNG.xoshiro128ss
    ].forEach((algo: PRNG): void => {
        it(`reproduces the same random sequence for a given seed: [${algo}]`,
            (): void => {
                let utilties = new SeededRandomUtilities(someSeedValue, algo);
                const result1 = Array.from({length: 10},
                    (): number => utilties.random());

                utilties = new SeededRandomUtilities(someSeedValue, algo);
                const result2 = Array.from({length: 10},
                    (): number => utilties.random());

                expect(result1).toEqual(result2);
            });
    });

    [
        PRNG.sfc32,
        PRNG.mulberry32,
        PRNG.xoshiro128ss
    ].forEach((algo: PRNG): void => {
        const testName = 'reproduces the same random sequence for'
            + ` a given seeded rand: [${algo}]`;

        it(testName, (): void => {
            let rand = new Rand(someSeedValue, algo);
            let utilties = new SeededRandomUtilities(rand);
            const result1 = Array
                .from({length: 10}, (): number => utilties.random());

            rand = new Rand(someSeedValue, algo);
            utilties = new SeededRandomUtilities(rand);
            const result2 = Array
                .from({length: 10}, (): number => utilties.random());

            expect(result1).toEqual(result2);
        });
    });
});
