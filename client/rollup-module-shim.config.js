import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default [
    // browser-friendly UMD build
    {
        input: 'src/es-module-shims.js',
        output: {
            name: 'es-module-shims',
            file: 'dist/es-module-shims.js',
            format: 'umd'
        },
        plugins: [
            resolve(),   // so Rollup can find modules
            commonjs(),  // so Rollup can convert node modules to an ES module
        ]
    },
];