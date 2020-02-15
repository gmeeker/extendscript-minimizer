// If there is no ; or newline between a block and a statement,
// we get "SyntaxError: Expected: ;"

// eslint-disable-next-line no-unused-vars
module.exports = function (fileInfo, api, options) {
  const j = api.jscodeshift;
  return j(fileInfo.source)
    .find(j.SwitchStatement)
    .filter(p => p.parent.node.type === 'BlockStatement')
    .insertAfter(';')
    .toSource();
};
