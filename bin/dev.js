#!/usr/bin/env node
// @ts-check
const path = require('node:path');
const tsx = require('tsx/cjs/api');

process.env.TSX_TSCONFIG_PATH = path.resolve(__dirname, '../tsconfig.json');

tsx.register();

require(path.resolve(__dirname, '../src/index.ts'));
