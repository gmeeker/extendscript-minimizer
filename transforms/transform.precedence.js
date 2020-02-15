// ExtendScript's interpreter seems to mess up precendence between
// left-to-right and right-to-left operators.
// Due to jscodeshift's design, this seems to require multiple passes,
// as the changes create new node paths.
// TODO: Some sort of depth-first traversal would make this easier.

const ParenthesizedExpression = 'ParenthesizedExpression';

const expressionTypes = [
  'AssignmentExpression',
  'BinaryExpression',
  'ConditionalExpression',
  'LogicalExpression',
  'SequenceExpression',
  'UnaryExpression',
  'UpdateExpression',
];

const addParenthesis = (j, node) => (
  node.type === ParenthesizedExpression || !expressionTypes.includes(node.type)
    ? node
    : j.parenthesizedExpression(node)
);

const parentParenthesis = (j, p, node) => (
  p.parent.node.type === ParenthesizedExpression || !expressionTypes.includes(p.parent.node.type)
    ? node
    : j.parenthesizedExpression(node)
);

const replaceAssign = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.AssignmentExpression)
      .filter(p => (
        expressionTypes.includes(p.parent.node.type)
          || expressionTypes.includes(p.node.left.type)
          || expressionTypes.includes(p.node.right.type)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.left.type !== ParenthesizedExpression
          || p.node.right.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.assignmentExpression(
          p.node.operator,
          addParenthesis(j, p.node.left),
          addParenthesis(j, p.node.right));
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceBinary = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.BinaryExpression)
      .filter(p => (
        expressionTypes.includes(p.parent.node.type)
          || expressionTypes.includes(p.node.left.type)
          || expressionTypes.includes(p.node.right.type)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.left.type !== ParenthesizedExpression
          || p.node.right.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.binaryExpression(
          p.node.operator,
          addParenthesis(j, p.node.left),
          addParenthesis(j, p.node.right));
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceConditional = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.ConditionalExpression)
      .filter(p => (
        expressionTypes.includes(p.parent.node.type)
          || expressionTypes.includes(p.node.test.type)
          || expressionTypes.includes(p.node.consequent.type)
          || expressionTypes.includes(p.node.alternate.type)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.test.type !== ParenthesizedExpression
          || p.node.consequent.type !== ParenthesizedExpression
          || p.node.alternate.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.conditionalExpression(
          addParenthesis(j, p.node.test),
          addParenthesis(j, p.node.consequent),
          addParenthesis(j, p.node.alternate)
        );
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceLogical = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.LogicalExpression)
      .filter(p => (
        expressionTypes.includes(p.parent.node.type)
          || expressionTypes.includes(p.node.left.type)
          || expressionTypes.includes(p.node.right.type)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.left.type !== ParenthesizedExpression
          || p.node.right.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.logicalExpression(
          p.node.operator,
          addParenthesis(j, p.node.left),
          addParenthesis(j, p.node.right));
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceSequence = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.SequenceExpression)
      .filter(p => (
        (p.node.expressions.concat([p.parent.node])).reduce((acc, n) => (
          acc || expressionTypes.includes(n)
        ), false)
      ) && (
        (p.node.expressions.concat([p.parent.node])).reduce((acc, n) => (
          acc || n.type !== ParenthesizedExpression
        ), false)
      ))
      .replaceWith(p => {
        const newNode = j.sequenceExpression(
          p.node.expressions.map(n => addParenthesis(j, n)));
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceUnary = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.UnaryExpression)
      .filter(p => (
        (expressionTypes.includes(p.parent.node.type)
         || expressionTypes.includes(p.node.argument.type))
          && ['-', '+', '!', '~'].includes(p.node.operator)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.argument.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.unaryExpression(
          p.node.operator,
          addParenthesis(j, p.node.argument),
          p.node.prefix);
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

const replaceUpdate = (api, node) => {
  const j = api.jscodeshift;
  let changed = false;
  let size = 1;
  while (size > 0) {
    size = node
      .find(j.UpdateExpression)
      .filter(p => (
        expressionTypes.includes(p.parent.node.type)
          || expressionTypes.includes(p.node.argument.type)
      ) && (
        p.parent.node.type !== ParenthesizedExpression
          || p.node.argument.type !== ParenthesizedExpression
      ))
      .replaceWith(p => {
        const newNode = j.updateExpression(
          p.node.operator,
          addParenthesis(j, p.node.argument),
          p.node.prefix);
        return parentParenthesis(j, p, newNode);
      })
      .size();
    if (size > 0) {
      changed = true;
    }
  }
  return changed;
};

// eslint-disable-next-line no-unused-vars
module.exports = function (fileInfo, api, options) {
  const root = api.jscodeshift(fileInfo.source);
  let changed = false;
  changed = replaceAssign(api, root) || changed;
  changed = replaceBinary(api, root) || changed;
  changed = replaceConditional(api, root) || changed;
  changed = replaceLogical(api, root) || changed;
  changed = replaceSequence(api, root) || changed;
  changed = replaceUnary(api, root) || changed;
  changed = replaceUpdate(api, root) || changed;
  return changed ? root.toSource() : null;
};
