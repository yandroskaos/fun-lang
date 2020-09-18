const util = require('util');

const {astGetFunction, objectFindField} = require('./ast');

const data = []
const code = []

const pop  = ()   => data.pop()
const push = item => data.push(item)

const copy = item => JSON.parse(JSON.stringify(item))

function itemsAreEqual(a, b) {
    if(a.type != b.type)
        return false

    switch(a.type) {
        case "bool":
        case "number":
        case "string":
            return (a.data == b.data)
        case "list":
            if(a.data.length != b.data.length)
                return false
            for(let i = 0; i < a.data.length; i++) {
                const r = itemsAreEqual(a.data[i], b.data[i])
                if (!r)
                    return false
            }
            return true
        case "object":
            if(a.data.length != b.data.length)
                return false
        
            for(let i = 0; i < a.data.length; i++) {
                const field = objectFindField(b, a.data[i].name)
                if(!field)
                    return false
                const r = itemsAreEqual(a.data[i].data, field.data)
                if (!r)
                    return false
            }
            return true
    }
    return false
}

//OPERATORS
// = operator???
function executeOperator(name) {
    const opTable = {
        "."  : apply,
        ":"  : field,
        "::" : cons,
        "==" : equal,
        "!=" : notEqual,
        ">"  : greaterThan,
        "<"  : lesserThan,
        ">=" : greaterEqualThan,
        "<=" : lesserEqualThan,
        "&&" : and,
        "||" : or,
        "!"  : not,
        "+"  : plus,
        "-"  : minus,
        "*"  : times,
        "/"  : div,
        "%"  : rem        
    }
    const op = opTable[name]
    op()
}

const apply = () => { //.
    const list = pop()

    while(list.data.length > 0) {
        code.push(list.data.pop())
    }
}

const cons = () => { //::
    const list = pop()
    const item = pop() 
    list.data.unshift(item)
    push(list)
}

const field = () => { //:
    const obj = pop()
    const value = pop()
    const field = pop()

    let success = false
    for(const f of obj.data) {
        if(f.name == field.data) {
            f.type = value.type
            f.data = value.data
            success = true
            break
        }
    }
    if(!success)
    {
        const o = {name:field.data, type:value.type, data:value.data}
        obj.data.push(o)
    }
    push(obj)
}

const equal = () => { //==
    const a = pop()
    const b = pop()
    push({type:"bool", data:itemsAreEqual(a, b)})
}

const notEqual = () => { //!=
    equal()
    const a = pop()
    push({type:"bool", data:!a.data})
}

const greaterThan = () => { //>
    const a = pop()
    const b = pop()
    push({type:"bool", data:(b.data > a.data)})
}

const lesserThan = () => { //<
    const a = pop()
    const b = pop()
    push({type:"bool", data:(b.data < a.data)})
}

const greaterEqualThan = () => { //>=
    const a = pop()
    const b = pop()
    push({type:"bool", data:(b.data >= a.data)})
}

const lesserEqualThan = () => { //<=
    const a = pop()
    const b = pop()
    push({type:"bool", data:(b.data <= a.data)})
}

const and = () => { //&&
    const a = pop()
    const b = pop()
    push({type:"bool", data:(a.data && b.data)})
}

const or = () => { //||
    const a = pop()
    const b = pop()
    push({type:"bool", data:(a.data || b.data)})
}

const not = () => { //!
    const a = pop()
    push({type:"bool", data:!a.data})
}

const plus = () => { //+
    const a = pop()
    const b = pop()
    if(a.type == "string" && b.type == "string"){
        push({type:"string", data:(a.data + b.data)})
    } else {
        push({type:"number", data:(a.data + b.data)})
    }
}

const minus = () => { //-
    const a = pop()
    const b = pop()
    push({type:"number", data:(b.data - a.data)})
}

const times = () => { //*
    const a = pop()
    const b = pop()
    push({type:"number", data:(a.data * b.data)})
}

const div = () => { // /
    const a = pop()
    const b = pop()
    push({type:"number", data:(b.data / a.data)})
}

const rem = () => { // %
    const a = pop()
    const b = pop()
    push({type:"number", data:(b.data % a.data)})
}

//Internals
function executeInternal(name) {
    const internalsTable = {
        "show" : show,
    }
    const cmd = internalsTable[name]
    cmd()
}

const show = () => {
    const a = pop()
    console.log(util.inspect(a.data, false, null, true))
}


// VM function
function matchItem(pattern, actual, ctx) {
    switch(pattern.type) {
        case "bool":
        case "number":
        case "string":
            return (actual.type == pattern.type && actual.data == pattern.data)

        case "any":
            return true

        case "symbol":
            ctx[pattern.data] = actual
            return true

        case "list":
            return matchList(pattern, actual, ctx)

        case "object":
            return matchObject(pattern, actual, ctx)
    }

    console.log("[ERROR] can't reach here")
    console.log("PATTERN = ", util.inspect(pattern, false, null, true))
    console.log("ACTUAL  = ", util.inspect(actual, false, null, true))
    console.log("CTX     = ", util.inspect(ctx, false, null, true))
    throw "[ERROR] at matchItem"
}

function matchList(pattern, actual, ctx) {
    if (pattern.type != actual.type)
        return false
    
    // Empty list
    if (pattern.data.length == 0)
        return actual.data.length == 0

    // Check list
    for(let i = 0; i < pattern.data.length; i++)
    {
        const patternItem = pattern.data[i]

        //Check if there is a "rest" as that will match
        if(patternItem.type == "rest") {
            ctx[patternItem.data] = {type: "list", data: copy(actual.data.slice(i))}
            return true;
        }

        //Check if index is actually greater that stack list length
        if( i >= actual.data.length)
            return false

        //Try to match both list elements
        const stackItem = actual.data[i]
            
        if(!matchItem(patternItem, stackItem, ctx))
            return false;
    }

    //Add name as this list to ctx if matched and if named
    if("name" in pattern) {
        ctx[pattern.name] = {type: "list", data: copy(actual.data)}
    }

    return true
}

function matchObject(pattern, actual, ctx) {
    if (pattern.type != actual.type)
        return false
    
    // Empty object
    if (pattern.data.length == 0)
        return actual.data.length == 0

    let mustHaveKeys = 0
    for(let i = 0; i < pattern.data.length; i++)
    {
        const patternItem = pattern.data[i]
        
        //Check if there is a "rest" as that will match
        if(patternItem.type == "rest") {
            // Calculate rest which is all keys except explicitly named in pattern ones
            let rest = []
            for(const item of actual.data) {
                if(!objectFindField(pattern, item.name))
                    rest.push(copy(item))
            }

            ctx[patternItem.data] = {type: "object", data: rest}
            return true;
        }

        mustHaveKeys++;

        if(patternItem.name != "_") {
            // Find field
            const actualItem = objectFindField(actual, patternItem.name)
            if(!actualItem)
                return false
            
            // Try to match field
            if(!matchItem(patternItem, actualItem, ctx))
                return false

            // Add variable to ctx
            ctx[patternItem.name] = copy(actualItem.data)
        } else {
            if(patternItem.type != "any") {
                
                // Search a match value inside object
                let success = false
                for(const item of actual.data) {
                    success = matchItem(patternItem, item, ctx)
                    if(success)
                        break
                }
                if(!success)
                    return false
            }
        }
    }

    if (actual.data.length < mustHaveKeys)
        return false

    //Add name as this list to ctx if matched and if named
    if("name" in pattern) {
        ctx[pattern.name] = {type: "object", data: copy(actual.data)}
    }
    
    return true
}

function calculateCtx(fn) {
    if(fn.patterns.length > data.length)
        return null 

    const newCtx = {}
    
    if(fn.patterns.length == 0)
        return newCtx 

    const actualArgs = data.slice(-fn.patterns.length)

    let success = true
    for(let i = 0; i < fn.patterns.length; i++) {
        success = matchItem(fn.patterns[i], actualArgs[i], newCtx)
        if(!success)
            break
    }

    if(success) {
        data.splice(-fn.patterns.length)
    } 

    return success ? newCtx : null
}

function substituteVars(expr, ctx) {
    if (expr.type == "variable") {
        const value = copy(ctx[expr.data])
        // Insite substitution
        for(const key in expr)
            delete expr[key]
        for(const key in value)
            expr[key] = value[key]
    } else if(expr.type == "list" || expr.type == "object") {
        for (const item of expr.data) {
            substituteVars(item, ctx)
        }
    }
}

function pushCode(fn, ctx) {
    for(let i = fn.body.length - 1; i >= 0; i--) {
        const expr = copy(fn.body[i])
        substituteVars(expr, ctx)
        code.push(expr)
    }
}

function evaluate(program, debug = false) {
    if(debug) {
        console.log("----------------------------")
    }
    
    code.push({type:"function", data:"main"})

    while(code.length > 0) {
        if(debug) {
            console.log("CODE = ", util.inspect(code, false, null, true))
            console.log("DATA = ", util.inspect(data, false, null, true))
            console.log("----------------------------")
        }

        const item = code.pop();

        switch(item.type) {
            //Constant
            case "bool":
            case "number":
            case "string":
            case "list":
            case "object":
                data.push(copy(item))
                break
            //Code
            case "function":
                if (program.internals.includes(item.data)) {
                    executeInternal(item.data)
                } else {
                    success = false
                    const defs = astGetFunction(program, item.data);
                    for(const fn of defs) {
                        ctx = calculateCtx(fn)
                        if(ctx) {
                            pushCode(fn, ctx)
                            success = true
                            break
                        }
                    }

                    if(!success) {
                        console.log("[ERROR] No stack match for function: ", defs[0].name)
                        console.log("DATA = ", util.inspect(data, false, null, true))
                        return
                    }
                }
                break
            case "operator":
                executeOperator(item.data)
                break
            /*
            case "native":
                symbol.data()
                break
            */
        }
    }

    console.log("DATA = ", util.inspect(data, false, null, true))
}

module.exports = {
    evaluate
}
