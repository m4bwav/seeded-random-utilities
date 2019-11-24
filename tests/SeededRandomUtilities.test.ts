import SeededRandomUtilities, {PRNG} from '../src/SeededRandomUtilities';
import Rand from 'rand-seed';

const someSeedValue = '1234';

const zero = 0;
const one = 1;
const negativeOne = -1;
describe('SeededRandomUtilities', (): void => {
    it('creates a new default instance', (): void => {
        const utilities = new SeededRandomUtilities;

        expect(utilities).toBeInstanceOf(SeededRandomUtilities);
        expect(typeof utilities.random()).toBe('number');
    });

    [
        undefined, // eslint-disable-line no-undefined
        PRNG.sfc32,
        PRNG.mulberry32,
        PRNG.xoshiro128ss
    ].forEach((algo: PRNG | undefined): void => {
        it(`creates a new [${algo}] instance`, (): void => {
            const utilities = new SeededRandomUtilities(someSeedValue, algo);

            expect(utilities).toBeInstanceOf(SeededRandomUtilities);
            expect(typeof utilities.random()).toBe('number');
        });
    });

    it('can produce 3 unique numbers out of 10', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = 3;
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 9;
        const randomArray = utilities
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
        const utilities = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = 10;
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 3;
        const randomArray = utilities
            .generateRandomArrayOfUniqueIntegers(numberOfPicks, maxValue);

        expect(randomArray.length).toBe(maxValue + one);
    });

    it('throws an error on negative picks', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);


        const numberOfPicks = -1;
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);
        const maxValue = 3;
        const attempt = (): number[] => utilities
            .generateRandomArrayOfUniqueIntegers(numberOfPicks, maxValue);

        expect(attempt).toThrowError('cannot be negative');
    });

    it('can produce a random bool', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const value = utilities.getRandomBool();

        expect(typeof value).toBe('boolean');
    });

    it('can produce a random inclusive int', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const inclusiveMax = 10;
        const value = utilities.getRandomIntInclusive(inclusiveMax);

        expect(typeof value).toBe('number');
        expect(value).toBeLessThanOrEqual(inclusiveMax);
    });

    it('can produce a random value', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const value = utilities.getRandom();
        expect(typeof value).toBe('number');

        expect(value).toBeGreaterThanOrEqual(zero);
        expect(value).toBeLessThanOrEqual(one);
    });
    it('can produce a arbitary random', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const max = 10;
        const value = utilities.getRandomArbitrary(max);

        expect(typeof value).toBe('number');
        expect(value).toBeLessThanOrEqual(max);
    });

    it('can produce a random char', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const value = utilities.getRandomChar();

        expect(typeof value).toBe('string');
        expect(value.length).toBe(one);
    });

    it('can produce a random element', (): void => {
        const utilities = new SeededRandomUtilities(someSeedValue);
        expect(utilities).toBeInstanceOf(SeededRandomUtilities);

        const limitedArray = ['A', 'B', 'C'];

        const value = utilities.selectRandomElement(limitedArray);

        expect(typeof value).toBe('string');
        expect(limitedArray.indexOf(value)).not.toBe(negativeOne);
    });

    it('returns undefined if there aren\'t any elements to select random from',
        (): void => {
            const utilities = new SeededRandomUtilities(someSeedValue);
            expect(utilities).toBeInstanceOf(SeededRandomUtilities);

            const limitedArray: string[] = [];

            const result = utilities.selectRandomElement(limitedArray);

            expect(result).toBeUndefined();
        });

    [
        PRNG.sfc32,
        PRNG.mulberry32,
        PRNG.xoshiro128ss
    ].forEach((algo: PRNG): void => {
        it(`reproduces the same random sequence for a given seed: [${algo}]`,
            (): void => {
                let utilities = new SeededRandomUtilities(someSeedValue, algo);
                const result1 = Array.from({length: 10},
                    (): number => utilities.random());

                utilities = new SeededRandomUtilities(someSeedValue, algo);
                const result2 = Array.from({length: 10},
                    (): number => utilities.random());

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
            let utilities = new SeededRandomUtilities(rand);
            const result1 = Array
                .from({length: 10}, (): number => utilities.random());

            rand = new Rand(someSeedValue, algo);
            utilities = new SeededRandomUtilities(rand);
            const result2 = Array
                .from({length: 10}, (): number => utilities.random());

            expect(result1).toEqual(result2);
        });
    });
});
