# seeded-random-utilities
Common random functions that are seedable with TypeScript support 



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