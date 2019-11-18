//This code was taken from Micaheldzjap's repo: https://github.com/michaeldzjap/rand-seed/blob/master/rollup.config.js
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import sourceMaps from 'rollup-plugin-sourcemaps';
import typescript from 'rollup-plugin-typescript2';
import {eslint} from 'rollup-plugin-eslint';
import {uglify} from 'rollup-plugin-uglify';
import {terser} from 'rollup-plugin-terser';
import pkg from './package.json';

const base = {
    input: 'src/index.ts',
    external: [
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
    ],
    watch: {
        include: 'src/**'
    },
    plugins: [
        eslint(),
        typescript({
            typescript: require('typescript')
        }),
        commonjs(),
        resolve(),
        sourceMaps(),
    ]
};

export default [
    {
        ...base,
        ...{
            output: {file: pkg.main, format: 'cjs', sourceMap: true},
            plugins: [...base.plugins, uglify()]
        }
    },
    {
        ...base,
        ...{
            output: {file: pkg.module, format: 'es', sourceMap: true},
            plugins: [...base.plugins, terser()]
        }
    }
];
