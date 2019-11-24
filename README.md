![NPM Version](https://img.shields.io/npm/v/seeded-random-utilities.svg?branch=master)
![downloads](https://img.shields.io/npm/dt/seeded-random-utilities.svg)
[![Build Status](https://travis-ci.com/m4bwav/seeded-random-utilities.svg?branch=master)](https://travis-ci.com/m4bwav/seeded-random-utilities)
![David](https://img.shields.io/david/m4bwav/seeded-random-utilities)
![David](https://img.shields.io/david/dev/m4bwav/seeded-random-utilities)
[![codecov](https://codecov.io/gh/m4bwav/seeded-random-utilities/branch/master/graph/badge.svg)](https://codecov.io/gh/m4bwav/seeded-random-utilities)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=m4bwav_seeded-random-utilities&metric=alert_status)](https://sonarcloud.io/dashboard?id=m4bwav_seeded-random-utilities)
[![License](https://img.shields.io/npm/l/seeded-random-utilities.svg)](https://github.com/m4bwav/seeded-random-utilities/blob/master/LICENSE) [![Join the chat at https://gitter.im/m4bwav/seeded-random-utilities](https://badges.gitter.im/m4bwav/seeded-random-utilities.svg)](https://gitter.im/m4bwav/seeded-random-utilities?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

# seeded-random-utilities
Common random functions that are seedable written in TypeScript with TypeScript support.

The [`rand-seed` npm package](https://www.npmjs.com/package/rand-seed) provides a random number generator similar to Math.random except with seeding.  This package uses `rand-seed` to provide random numbers, but also implements some common easy-to-use random utilties.

## Installation
This package is available through _npm_:

```
npm install --save seeded-random-utilties
```

## Usage
Either import directly

```html
<script src="path-to-seeded-random-utilties/seeded-random-utilties.js"></script>
```

or import in your own scripts using

```javascript
import SeededRandomUtilities from 'seeded-random-utilties';
```

Then simply create a new instance with an (optional) seed:

```javascript
const rand = new SeededRandomUtilities('1234');

rand.getRandomBool(); // Generate a new random number
```

If no seed is specified the call to `rand.random()` will simply be forwarded to `Math.random()`. So it won't operate in a repeatable seeded fashion if no seed is supplied.

```javascript
// Create a new random number generator using the xoshiro128** algorithm
const rand = new SeededRandomUtilities('1234', PRNG.xoshiro128ss);
```

An interface is provided for the main random class, `RandomUtilities`.

## Example
A simple example is included. This may be run with _node_: `node sample/index.js`

Another example that was used to verify that the package can be installed and used properly can be found in `sample/test-random-unique-integers-lists`.  A test package is in there that one can use to examine large sets of the output from `generateRandomArrayOfUniqueIntegers`.

## API

| Method                        | Description  |
|:------------------------------|:-------------|
| random(): number, getRandom(): number         | Generate a random integer.  |
| getRandomIntegar(max: number, min = zero): number      | Generate a random integer.  |
| getRandomArbitrary(max: number, min = zero): number          | Generate a random arbitary.  |
| getRandomIntInclusive(max: number, min = zero): number  | Generate a random max inclusive integer.  | 
| getRandomBool(): boolean    | Generate a random boolean (true/false). |
| getRandomChar(): string                | Generate a random character. |
|selectRandomElement<T>(source: T[]): T||Selects a random element out of the provided array|
|selectUniqueRandomElements<T>(source: T[], picks: number): T[]|Select a number of random unique elments in a provided array|
|shuffle<T>(array: T[], copy?: boolean): T[]|string| Randomly shuffle a provided array|
|chooseBooleanRandomlyWithProbability(itemCount: number, picks?: number): boolean| Choose a number of boolean randomly with the provide percentage|
|generateRandomArrayOfUniqueIntegers(amount: number, maxValue: number): number[]| Choose a list of unique integers out of a list of consecutive integers|



## Contributing

Pull requests and stars are highly welcome.

For bugs and feature requests, please [create an issue](https://github.com/m4bwav/seeded-random-utilities/issues/new).

## Motivations
In a recent project I was working on I needed the use of a seeded random number generator, preferably written in TypeScript. I found [rand-seed](https://www.npmjs.com/package/rand-seed), but while it provided the basic engine to run randomization it didn't have any implementation for picking unique numbers out of a set or really anything other than the root output similar to Math.random().  I had been waiting for an excuse to make a TypeScript style npm package, in order to provide tangible proof of my understanding of TypeScript.   So this seemed like the perfect excuse to attempt to fill a narrow niche with a package that had a set of random utilties as well as one that was seeded and in TypeScript.
I started reading different TypeScript npm package tutorials and finally settled on using [How to Create and Publish an NPM module in TypeScript](https://codeburst.io/https-chidume-nnamdi-com-npm-module-in-typescript-12b3b22f0724)
I first attemptted implementing simple utilties like generating a random integer.   For and more, I kept seeing people point to the [MDN article on Math.Random], and noticed that it some nice basic implementations of many common random utilties.  So I adapted most of those utilties to the new seeded TypeScript package I was buliding.  Then I noticed the [random-utility - npm](https://www.npmjs.com/package/random-utility), while I was getting close to have creating a unique element picking algorithm.  I adapted some of the easy to adapte to seeded TypeScript versions.
Finally I noticed more and more I liked the TypeScript project setup in rand-seed and ended up copying more and more of it i into my project.  It gave me chance to work on rollup which I hadn't gotten into yet.  Thanks to all mentioned and those unmentioned that I don't know of.


## Links
* "[rand-seed - npm](https://www.npmjs.com/package/rand-seed)" - Provides the seeded random implementation powering the utilities.  Also directly used a lot of the TypeScript setup and project design from here, blending it partly with the following tutorial link and other random utilities.
* "[How to Create and Publish an NPM module in TypeScript](https://codeburst.io/https-chidume-nnamdi-com-npm-module-in-typescript-12b3b22f0724)" - One of the best tutorials on how to publish a TypeScript package that is usefulable in both JavaScript and TypeScript.
* "[Math.random() - JavaScript | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random)" - This MDN web doc provided the inspriation and logic behind many of the utilties.  They were adpated to both seeding and into TypeScript.
* "[random-utility - npm](https://www.npmjs.com/package/random-utility)" - I created seeded versions of a few of these utitlities.  It wasn't a straight rip, more just inspiration. 