const {astFunctionExists} = require('./ast');

const patternsWalkSymbols = patterns => {
    return patterns.reduce( (symbols, pattern) => {
        return symbols.concat(patternGetSymbols(pattern))
    }, []);
}

const patternGetSymbols = pattern => {
    let symbols = []

    if("name" in pattern)
        symbols.push(pattern.name)

    if (pattern.type == "symbol")
        symbols.push(pattern.data)

    if (pattern.type == "rest")
        symbols.push(pattern.data)

    if (pattern.type == "list" || pattern.type == "object")
        symbols = symbols.concat(patternsWalkSymbols(pattern.data));

    return symbols;
}


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

const astVerifyFunctionPatterns = ast => {
    let failure = false
    for (const fn of ast.fns) {
        symbols = patternsWalkSymbols(fn.patterns)

        const groupedSymbols = symbols.reduce( (group, symbol) => {
            group[symbol] = (group[symbol] || 0) + 1;
            return group;
        } , {})

        for (const symbol in groupedSymbols) {
            if(groupedSymbols[symbol] > 1) {
                console.log(`Symbol "${symbol}" in function "${fn.name}" is defined ${groupedSymbols[symbol]} times in function pattern`)
                failure = true;
            }
        }
    }

    return !failure;
}

const astVerifyFunctionBodies = ast => {
    let failure = false
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

    //Verify that symbols in patterns are not defined multiple times
    if(!astVerifyFunctionPatterns(ast)) 
        return false;
    
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
