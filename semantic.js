const {astFunctionExists} = require('./ast');

const patternsContainSymbol = (patterns, symbol) => {
    return patterns.reduce( (result, pattern) => {
        return result || patternHasSymbol(pattern, symbol)
    }, false);
}

const patternHasSymbol = (pattern, symbol) => {
    if("name" in pattern)
        if (pattern.name == symbol)
            return true;

    if (pattern.type == "symbol")
        return pattern.data == symbol;

    if (pattern.type == "rest")
        return pattern.data == symbol;

    if (pattern.type == "list" || pattern.type == "object")
        return patternsContainSymbol(pattern.data, symbol);

    return false;
}

const functionProcessBodySymbols = (patterns, expr) => {
    if (expr.type == "symbol") {

        expr.type = patternsContainSymbol(patterns, expr.data) ? "variable" : "function" ;

    } else if (expr.type == "list" || expr.type == "object") {
        
        for(const item of expr.data)
            functionProcessBodySymbols(patterns, item)
    }
}

const astProcessSymbols = ast => {
    for (const fn of ast.fns) {
        for (const expr of fn.body) {
            functionProcessBodySymbols(fn.patterns, expr)
        }
    }
}

const astVerifyFunctionBodies = ast => {
    failure = false
    for (const fn of ast.fns) {
        for (const expr of fn.body) {
            if (expr.type == "function" && !ast.internals.includes(expr.data) && !astFunctionExists(ast, expr.data)) {
                console.log(`Symbol "${expr.data}" in function "${fn.name}" is not defined as variable in patterns or function`)
                failure = true;
            }
        }
    }

    return !failure;
}

const astMainDefined = ast => astFunctionExists(ast, "main")


function check(ast) {
    //We substitute every symbol in body either as variable or function
    astProcessSymbols(ast);
    
    //Verify that every symbol classified as function is indeed defined
    if(!astVerifyFunctionBodies(ast)) 
        return false;

    //Verify "main" entry point is defined
    if(!astMainDefined(ast)) {
        console.log("No 'main' function defined")
        return false;
    }

    return true;
}

module.exports = {
    check
}
