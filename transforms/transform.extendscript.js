const precedence = require('./transform.precedence');
const switchStatement = require('./transform.switch');

// eslint-disable-next-line no-unused-vars
module.exports = function (file, api, options) {
  const fixes = [precedence, switchStatement];
  let changed = false;
  let src = file.source;
  fixes.forEach(fix => {
    if (typeof src === 'undefined') { return; }
    const dst = fix({ ...file, source: src }, api, options);
    if (dst) {
      src = dst;
      changed = true;
    }
  });
  return changed ? src : null;
};
