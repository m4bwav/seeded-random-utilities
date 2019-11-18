export interface ISeededRandomUtilities {
  chooseBooleanRandomlyWithProbability(
    itemCount: number,
    picks?: number
  ): boolean;
  generateRandomArrayOfUniqueIntegers(
    amount: number,
    maxValue: number
  ): number[];
  getRandom(): number;
  getRandomIntegar(max: number, min?: number): number;
  getRandomBool(): boolean;
  getRandomChar(): string;
  getRandomArbitrary(max: number, min?: number): number;
  getRandomIntInclusive(max: number, min?: number): number;
  selectRandomElement<T>(source: T[]): T;
  selectUniqueRandomElements<T>(source: T[], picks: number): T[];
}
