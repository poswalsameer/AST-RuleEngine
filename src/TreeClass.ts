export class ASTNode {
  nodeType: string;
  left: ASTNode | null;
  right: ASTNode | null;
  value: any;

  constructor(nodeType: string, left: ASTNode | null = null, right: ASTNode | null = null, value: any = null) {
    this.nodeType = nodeType;
    this.left = left;
    this.right = right;
    this.value = value;
  }
}


export function createRule(ruleString: string): ASTNode {
  if (typeof ruleString !== 'string' || !ruleString.trim()) {
    throw new Error('Invalid rule string: ruleString must be a non-empty string');
  }

  const tokens = tokenize(ruleString);
  return parseExpression(tokens);
}

function tokenize(ruleString: string): string[] {
  if (!ruleString || typeof ruleString !== 'string') {
      throw new Error('Invalid input to tokenize');
  }
  
  const tokens = ruleString.match(/[\w\s]+|[><=!]+|AND|OR|\(|\)/g) || [];
  console.log("Tokens:", tokens); 
  return tokens.map(token => token.trim()).filter(token => token.length > 0);
}


// Parse the tokens into an AST
export function parseExpression(tokens: string[]): ASTNode {

  const outputStack: ASTNode[] = [];
  const operatorStack: ASTNode[] = [];

  const precedence: { [key: string]: number } = { 'AND': 2, 'OR': 1 };

  for (const token of tokens) {
    if (token === 'AND' || token === 'OR') {
      const newOperator = new ASTNode('operator', null, null, token);

      while (
        operatorStack.length &&
        precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token]
      ) {
        const operatorNode = operatorStack.pop()!;
        operatorNode.right = outputStack.pop()!;
        operatorNode.left = outputStack.pop()!;
        outputStack.push(operatorNode);
      }

      operatorStack.push(newOperator);
    } else if (token === '(') {
      operatorStack.push(new ASTNode('parenthesis', null, null, token));
    } else if (token === ')') {
      while (operatorStack.length && operatorStack[operatorStack.length - 1].value !== '(') {
        const operatorNode = operatorStack.pop()!;
        operatorNode.right = outputStack.pop()!;
        operatorNode.left = outputStack.pop()!;
        outputStack.push(operatorNode);
      }
      operatorStack.pop(); 
    } else {
      
      outputStack.push(parseCondition(token));
    }
  }

  while (operatorStack.length) {
    const operatorNode = operatorStack.pop()!;
    operatorNode.right = outputStack.pop()!;
    operatorNode.left = outputStack.pop()!;
    outputStack.push(operatorNode);
  }

  return outputStack[0];
}

export function parseCondition(condition: string): ASTNode {

  const operators = [">", "<", "=", ">=", "<="];
  
  let operator: string | undefined;
  for (const op of operators) {
      if (condition.includes(op)) {
          operator = op;
          break;
      }
  }

  if (!operator) {
      throw new Error(`Invalid condition: "${condition}". No valid operator found.`);
  }

  const [leftOperand, rightOperand] = condition.split(operator).map(op => op.trim());

  console.log("Parsed Condition:", { leftOperand, operator, rightOperand }); 

  if (!rightOperand) {
      throw new Error(`Invalid condition: "${condition}". Right operand is missing.`);
  }

  return new ASTNode("operand", null, null, {
      leftOperand: leftOperand,
      operator: operator,
      rightOperand: rightOperand.replace(/'/g, "").trim() 
  });
}


export function evaluateRule(ast: ASTNode, data: { [key: string]: any }): boolean {
  if (ast.nodeType === "operator") {
    const leftEval = evaluateRule(ast.left!, data);
    const rightEval = evaluateRule(ast.right!, data);

    if (ast.value === "AND") {
      return leftEval && rightEval;
    } else if (ast.value === "OR") {
      return leftEval || rightEval;
    }
  } else if (ast.nodeType === "operand") {
    const condition = ast.value;
    const leftOperand = data[condition.leftOperand];
    const rightOperand = condition.rightOperand;

    switch (condition.operator) {
      case ">":
        return leftOperand > parseFloat(rightOperand);
      case "<":
        return leftOperand < parseFloat(rightOperand);
      case "=":
        return leftOperand === rightOperand.replace(/'/g, "");
      case ">=":
        return leftOperand >= parseFloat(rightOperand);
      case "<=":
        return leftOperand <= parseFloat(rightOperand);
      default:
        return false;
    }
  }

  return false;
}
