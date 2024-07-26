// Basic Scheme interpreter in JavaScript

// Cons cell implementation
class Cons {
  constructor(car, cdr) {
    this.car = car;
    this.cdr = cdr;
  }
}

// Environment to store variables and their values
class Environment {
  constructor(parent = null) {
    this.vars = new Map();
    this.parent = parent;
  }

  lookup(symbol) {
    if (this.vars.has(symbol)) {
      return this.vars.get(symbol);
    }
    if (this.parent) {
      return this.parent.lookup(symbol);
    }
    throw new Error(`Undefined variable: ${symbol}`);
  }

  define(symbol, value) {
    this.vars.set(symbol, value);
  }
}

// Tokenizer function
function tokenize(input) {
  return input.replace(/\(/g, ' ( ')
              .replace(/\)/g, ' ) ')
              .trim()
              .split(/\s+/);
}

// Parser function
function parse(input) {
  const tokens = tokenize(input);
  let position = 0;

  function parseExpression() {
    const token = tokens[position++];
    if (token === undefined) {
      throw new Error('Unexpected end of input');
    }

    if (token === '(') {
      const list = [];
      while (tokens[position] !== ')') {
        if (tokens[position] === undefined) {
          throw new Error('Unmatched parenthesis');
        }
        list.push(parseExpression());
      }
      position++; // Skip past the ')'
      return arrayToLinkedList(list);
    } else if (token === ')') {
      throw new Error('Unexpected closing parenthesis');
    } else if (token === "'") {
      return new Cons('quote', new Cons(parseExpression(), null));
    } else {
      return parseAtom(token);
    }
  }

  function parseAtom(token) {
    if (token === '#t' || token === '#f') {
      return token === '#t';
    }
    const number = parseFloat(token);
    if (!isNaN(number)) {
      return number;
    }
    return token; // It's a symbol
  }

  function arrayToLinkedList(array) {
    if (array.length === 0) {
      return null;
    }
    return new Cons(array[0], arrayToLinkedList(array.slice(1)));
  }

  const result = parseExpression();
  if (position !== tokens.length) {
    throw new Error('Unexpected extra input');
  }
  return result;
}

// Evaluator function
function evaluate(expr, env) {
  if (typeof expr === 'string') {
    return env.lookup(expr);
  }
  if (!(expr instanceof Cons)) {
    return expr; // Self-evaluating expressions (numbers, booleans, etc.)
  }

  const op = expr.car;
  const args = expr.cdr;

  switch (op) {
    case 'quote':
      return args.car;
    case 'if':
      const condition = evaluate(args.car, env);
      return condition ? evaluate(args.cdr.car, env) : evaluate(args.cdr.cdr.car, env);
    case 'lambda':
      return function(...params) {
        const newEnv = new Environment(env);
        let paramList = args.car;
        params.forEach(param => {
          newEnv.define(paramList.car, param);
          paramList = paramList.cdr;
        });
        return evaluate(args.cdr.car, newEnv);
      };
    case 'define':
      env.define(args.car, evaluate(args.cdr.car, env));
      return undefined;
    default:
      const proc = evaluate(op, env);
      const evaluatedArgs = [];
      let argList = args;
      while (argList instanceof Cons) {
        evaluatedArgs.push(evaluate(argList.car, env));
        argList = argList.cdr;
      }
      return proc(...evaluatedArgs);
  }
}

// Helper function to convert linked list to array (for printing)
function linkedListToArray(list) {
  const result = [];
  while (list instanceof Cons) {
    result.push(list.car);
    list = list.cdr;
  }
  return result;
}

// Helper function to print Scheme expressions
function printExpr(expr) {
  if (expr instanceof Cons) {
    return `(${linkedListToArray(expr).map(printExpr).join(' ')})`;
  } else if (typeof expr === 'string') {
    return expr;
  } else if (typeof expr === 'boolean') {
    return expr ? '#t' : '#f';
  } else {
    return String(expr);
  }
}

// REPL function
function repl() {
  const globalEnv = new Environment();
  // Define basic operations
  globalEnv.define('+', (a, b) => a + b);
  globalEnv.define('-', (a, b) => a - b);
  globalEnv.define('*', (a, b) => a * b);
  globalEnv.define('/', (a, b) => a / b);
  globalEnv.define('=', (a, b) => a === b);
  globalEnv.define('<', (a, b) => a < b);
  globalEnv.define('>', (a, b) => a > b);

  while (true) {
    const input = prompt('scheme> ');
    if (input === null) break;
    try {
      const parsed = parse(input);
      const result = evaluate(parsed, globalEnv);
      console.log(printExpr(result));
    } catch (error) {
      console.error(error.message);
    }
  }
}

// Start the REPL
repl();
