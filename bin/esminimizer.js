#!/usr/bin/env node
const path = require('path');
const process = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const rootPath = path.dirname(path.dirname(__filename));
const transforms = path.join(rootPath, 'transforms');

function help() {
  console.log(`${process.argv[1]} [--js_language_in lang] [--js_language_out lang] [--jsx_language_in lang] [--jsx_language_out lang] {GCC args} -i input -o output`);
  process.exit(1);
}

/* eslint-disable no-await-in-loop */
async function build(input, output, options = {}) {
  let { flags } = options;
  if (input.match(/\.jsx$/)) {
    flags = flags.concat([
      '--language_in', options.jsx_language_in,
      '--language_out', options.jsx_language_out,
    ]);
  } else {
    flags = flags.concat([
      '--language_in', options.js_language_in,
      '--language_out', options.js_language_out,
    ]);
  }
  try {
    let stdout;
    let stderr;
    ({ stdout, stderr } = await exec(`npx google-closure-compiler ${flags.map(f => `'${f}'`).join(' ')} --js '${path.resolve(input)}' --js_output_file '${path.resolve(output)}'`, { cwd: rootPath }));
    if (stdout.trim()) {
      console.log(stdout);
    }
    if (stderr.trim()) {
      console.error(stderr);
    }
    if (input.match(/\.jsx$/)) {
      ({ stdout, stderr } = await exec(`npx jscodeshift --no-babel -t ${path.join(transforms, 'transform.extendscript.js')} '${path.resolve(output)}'`, { cwd: rootPath }));
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(10);
  }
}

function parseAndBuild() {
  let input;
  let output;
  const options = {
    js_language_in: 'ECMASCRIPT_2015',
    js_language_out: 'ECMASCRIPT5',
    jsx_language_in: 'ECMASCRIPT5_STRICT',
    jsx_language_out: 'ECMASCRIPT5',
    flags: [],
  };
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    switch (arg) {
      case '--js_language_in':
        options.js_language_in = process.argv[++i];
        break;
      case '--js_language_out':
        options.js_language_out = process.argv[++i];
        break;
      case '--jsx_language_in':
        options.jsx_language_in = process.argv[++i];
        break;
      case '--jsx_language_out':
        options.jsx_language_out = process.argv[++i];
        break;
      case '-i':
        input = process.argv[++i];
        break;
      case '-o':
        output = process.argv[++i];
        break;
      case '--create_source_map':
        options.flags.push(process.argv[i++]);
        options.flags.push(path.resolve(process.argv[i]));
        break;
      default:
        // Assume this is an GCC option
        options.flags.push(process.argv[i]);
        break;
    }
  }
  if (!input || !output) {
    help();
  } else {
    build(input, output, options);
  }
}

parseAndBuild();
