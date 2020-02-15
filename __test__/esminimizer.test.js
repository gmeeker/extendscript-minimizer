/* eslint-disable no-undef */

const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const run = name => {
  const input = path.join(path.dirname(__filename), name);
  const output = path.join('./expected', name);
  return exec(`node ./bin/esminimizer.js -i ${input} -o ${output}`)
    .then(({ stderr }) => {
      if (stderr) {
        console.error(stderr);
      }
      return new Promise(resolve => setTimeout(resolve, 10000));
    })
    .then(() => util.promisify(fs.readFile)(output))
    .then(buf => buf.toString().trim());
};

beforeAll(() => {
  util.promisify(fs.mkdir)('./expected', 0o777).catch(() => null);
});

describe('esminimizer', () => {
  test('Test help', () => {
    expect(exec('node ./bin/esminimizer.js')).rejects.toThrow();
  });
  test('Test JavaScript', () => {
    expect(run('js.logic.js')).resolves.toEqual('function test(a,b,c){return a||b&&c};');
  });
  test('Test boolean logic expressions', () => {
    expect(run('es.logic.jsx')).resolves.toEqual('function test(a,b,c){return ((a) || (b&&c));};');
  });
  test('Test nested conditional operator', () => {
    expect(run('es.conditional.jsx')).resolves.toEqual('function test(a,b){return ((a) ? (b?"one":"two") : ("three"));};');
  });
});
