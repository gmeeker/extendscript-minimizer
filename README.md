# extendscript-minimizer: minify and obfuscate ExtendScript #

This is a tool somewhat minify and obfuscate ExtendScript code for use in Adobe CEP panels.
It's based on top of Google Closure Compiler and jscodeshift.

ExtendScript is basically JavaScript but has not been updated in many years, so many
tools like Babel and Webpack are problematic.  Google Closure Compile seems promising
(when targeting ES5).  Unfortunately the ExtendScript interpreter does not follow the
same operator precedence.  This usually not a problem for code written by hand but it's
a huge problem for GCC output.  For example, GCC transforms if/if else/else into nested
conditional operators, and ExtendScript will throw "Expected: : "

It's important to note that extendscript-minimizer expects valid ES5 code, *not* ExtendScript.
If that code does not use explicit parentheses, the can be differences, e.g.:
```
true || false && false
```
will evaluate to false in ExtendScript but true in JavaScript.
ExtendScript will interpret like this:
```
(true || false) && false
```
but JavaScript will interpret like this:
true || (false && false)
```

The exact details are not published and rather than reverse
engineer their implementation, we choose to add explicit parentheses.  Our primary goal
is to obfuscate, not minimize every possible character.

While other options have existed for obfuscating ES for public release
(such as compiling to JSXBIN) this tool chooses to produce harder to read code using
open source Npm modules.

There are additionals bugs we work around as well, currently just adding whitespace
after a switch statement block.

## Example usage ##
This assumes the you want to minimize:
'panel.jsx', 'jsx/', and lib/CSInterface.js (not ExtendScript)

package.json:
```
  "scripts": {
    "build": "eslint --ext js,jsx jsx panel.jsx && node scripts/compile.js",
  }
...
```

scripts/compile.js:
```
const fs = require('fs');
const path = require('path');
const process = require('process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function build() {
  const dirs = ['./build', './build/jsx', './build/lib'];
  for (let i = 0; i < dirs.length; i++) {
    try {
      await util.promisify(fs.mkdir)(dirs[i], 0o777);
    } catch (err) {
    }
  }
  const files = ['panel.jsx', 'lib/CSInterface.js'];
  const jsx = await util.promisify(fs.readdir)('jsx');
  for (let i = 0; i < jsx.length; i++) {
    if (jsx[i].endsWith('.jsx')) {
      files.push(path.join('jsx', jsx[i]));
    }
  }
  for (let i = 0; i < files.length; i++) {
    const outpath = './build/' + files[i];
    let flags = '';
    flags += '--js_language_out ECMASCRIPT5';
    flags += ' --js_language_in ECMASCRIPT_2015';
    flags += ' --jsx_language_out ECMASCRIPT5';
    flags += ' --jsx_language_in ECMASCRIPT5_STRICT';
    try {
      let stdout;
      let stderr;
      ({ stdout, stderr } = await exec(`npx esminimizer ${flags} --create_source_map "${outpath}.map" -i "${files[i]}" -o "${outpath}"`));
      if (stdout) {
        console.log(stdout);
      }
      if (stderr) {
        console.error(stderr);
      }
    } catch (err) {
      console.error(err);
      process.exit(10);
    }
  }
}

build();
```

## Background ##

Other people have run into these problems as well:

https://community.adobe.com/t5/after-effects/extendscript-throws-on-nested-ternary-operator/td-p/9573874?page=1
https://community.adobe.com/t5/indesign/bitwise-operators-and-precedence/td-p/9855461?page=1
