// src/index.ts
import express from 'express';
import bodyParser from 'body-parser';
import { createRule, evaluateRule, ASTNode } from '../TreeClass';

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/create-rule', (req, res) => {

  const { ruleString } = req.body;
  console.log("Received ruleString:", ruleString); 

  try {
    const ruleAST: ASTNode = createRule(ruleString);
    res.status(200).json({
      message: 'Rule created successfully!',
      ruleAST
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating rule!',
    //@ts-ignore
      error: error.message
    });
  }
});

app.post('/check-eligibility', (req, res) => {
  const { ruleString, userData } = req.body;
  try {
    const ruleAST: ASTNode = createRule(ruleString);
    const isEligible: boolean = evaluateRule(ruleAST, userData);
    res.status(200).json({
      message: isEligible ? 'User is eligible' : 'User is not eligible',
      isEligible
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error evaluating rule!',
    //@ts-ignore   
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
