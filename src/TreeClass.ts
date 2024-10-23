// Define the structure for AST Node
export class ASTNode{
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

// Function to create a rule (AST) from a string
export function createRule(ruleString: string): ASTNode {
    const tokens = tokenize(ruleString);
    return parseExpression(tokens);
  }
  
  // Tokenize the rule string (simple tokenizer for operators, conditions, parentheses)
  function tokenize(ruleString: string): string[] {
    return ruleString.match(/\w+|[><=!]+|['\w\s]+|AND|OR|\(|\)/g) || [];
  }
  
  // Parse the tokens into an AST
export function parseExpression(tokens: string[]): ASTNode {
    const stack: ASTNode[] = [];
    let currentOperator: ASTNode | null = null;
  
    for (const token of tokens) {
      if (token === "AND" || token === "OR") {
        currentOperator = new ASTNode("operator", null, null, token);
      } else if (token === "(") {
        stack.push(currentOperator!);
        currentOperator = null;
      } else if (token === ")") {
        const rightNode = stack.pop()!;
        currentOperator!.right = rightNode;
        stack.push(currentOperator!);
      } else {
        const conditionNode = parseCondition(token);
        if (currentOperator) {
          currentOperator.right = conditionNode;
          stack.push(currentOperator);
          currentOperator = null;
        } else {
          stack.push(conditionNode);
        }
      }
    }
  
    return stack[0];
  }
  
  // Parse conditions like age > 30 or department = 'Sales'
export function parseCondition(condition: string): ASTNode {
    const operators = [">", "<", "=", ">=", "<="];
    let operator = operators.find(op => condition.includes(op));
    let [leftOperand, rightOperand] = condition.split(operator!);
  
    return new ASTNode("operand", null, null, {
      leftOperand: leftOperand.trim(),
      operator: operator!.trim(),
      rightOperand: rightOperand.trim()
    });
  }
  
  // Combine multiple rules into a single AST using AND or OR
export function combineRules(rules: string[], operator: string = "AND"): ASTNode {
    let combinedAST: ASTNode | null = null;
  
    for (const rule of rules) {
      const ast = createRule(rule);
  
      if (combinedAST === null) {
        combinedAST = ast;
      } else {
        combinedAST = new ASTNode("operator", combinedAST, ast, operator);
      }
    }
  
    return combinedAST!;
  }
  
  // Function to evaluate the AST against provided data
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