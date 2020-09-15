const util = require('util');


function findSymbolInArguments(symbol, args) {
    for (const arg of args) {
        if (arg.name == symbol)
            return true;

        if ((arg.name == "variable" || arg.name == "rest_of_list") && (arg.data == symbol))
            return true;

        if ((arg.name == "list" || arg.name == "object") && findSymbolInArguments(symbol, arg.data))
            return true;
    }

    return false;
}

function processFunctionSymbolsRec(item, args) {
    if (item.name == "symbol") {
        item.name = findSymbolInArguments(item.data, args) ?
            "variable" :
            "function" ;
    } else if (item.name == "list") {
        for(const e of item.data)
            processFunctionSymbolsRec(e, args)
    } else if (item.name == "object") {
        for (const f of item.data){
            processFunctionSymbolsRec(f.data, args)    
        }
    }
}


function processFunctionSymbols(fn) {
    for (const i of fn.body)
        processFunctionSymbolsRec(i, fn.arguments)
}

function processAst(ast) {
    for (const fn of ast) {
        processFunctionSymbols(fn)
    }
}

function functionExists(name, ast) {
    for(const fn of ast) {
        if (fn.name == name) 
            return true;
    }
    return false;
}

function verifyFunctionBody(body, ast) {
    for (const item of body) {
        if (item.name == "function" && !functionExists(item.data, ast)) {
            console.log(item.data, "verifyFunctionsInBody")
            return false
        }
    }
    return true;
}

function verifyFunctionsInBody(ast) {
    for (const fn of ast) {
        if (!verifyFunctionBody(fn.body, ast)) {
            console.log(fn.name, "verifyFunctionsInBody")
            return false;
        }
    }
    return true;
}

function checkMain(ast) {
    return functionExists("main", ast)
}

function check(ast) {
    processAst(ast);
    
    if(!verifyFunctionsInBody(ast)) {
        console.log("verifyFunctionsInBody")
        return false;
    }

    if(!checkMain(ast)) {
        console.log("checkMain")
        return false;
    }

    return true;
}

module.exports = {
    check
}
