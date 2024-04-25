// run "npx webpack --target=node"
const path = require('path');

module.exports = {
    target: 'node',
    mode: 'production', // Enables minification optimizations
    entry: './index.js', // Your script's entry point
    output: {
        filename: 'index.min.js', // Output file name
        path: path.resolve(__dirname, 'dist'), // Output directory
    },
};