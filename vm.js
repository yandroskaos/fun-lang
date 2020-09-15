const util = require('util');

const { match } = require("./combinators")

const data = []
const code = []
const ctx  = []

const pop  = ()   => data.pop()
const push = item => data.push(item)

const removeCtx  = () => ctx.pop()
const currentCtx = () => ctx[ctx.length - 1]

//OPERATORS
// match("="),
const apply = () => { //.
    const l = pop()
    //must be a list
    for(let i = l.data.length - 1; i >= 0; i--) {
        const symbol = l.data[i]
        code.push(symbol)
    }
}

const cons = () => { //::
    const a = pop()
    const b = pop() //list
    a.data.unshift(b)
    push(a)
}

const ocons = () => { //:
    const obj = pop()
    const value = pop()
    const field = pop()

    let success = false
    for(const f of obj.data) {
        if(f.name == field.data) {
            f.data = value
            success = true
            break
        }
    }
    if(!success)
    {
        const o = {name:field.data, data:value}
        obj.data.push(o)
    }
    push(obj)
}


function areEqual(a, b){
    if(a.name != b.name)
        return false

    switch(a.name) {
        case "bool":
        case "number":
        case "string":
            return (a.data == b.data)
            break
        case "list":
            if(a.data.length != b.data.length)
                return false
            for(let i = 0; i < a.data.length; i++){
                const r = areEqual(a.data[i], b.data[i])
                if (!r)
                    return false
            }
            return true
        case "object":
            if(a.data.length != b.data.length) {
                return false
            }
        
            let n = a.data.length
            for(let i = 0; i < a.data.length; i++){
                for(const field of b.data) {
                    if(field.name == a.data[i].name){
                        const r = areEqual(a.data[i].data, field.data)
                        if (!r)
                            return false
                        n--
                    }
                }
            }
            return n == 0
    }
    return false
}

const equal = () => { //==
    const a = pop()
    const b = pop()
    push({name:"bool", data:areEqual(a, b)})
}
const notEqual = () => { //!=
    equal()
    const a = pop()
    push({name:"bool", data:!a.data})
}
const greaterThan = () => { //>
    const a = pop()
    const b = pop()
    push({name:"bool", data:(b.data > a.data)})
}
const lesserThan = () => { //<
    const a = pop()
    const b = pop()
    push({name:"bool", data:(b.data < a.data)})
}
const greaterEqualThan = () => { //>=
    const a = pop()
    const b = pop()
    push({name:"bool", data:(b.data >= a.data)})
}
const lesserEqualThan = () => { //<=
    const a = pop()
    const b = pop()
    push({name:"bool", data:(b.data <= a.data)})
}

const and = () => { //&&
    const a = pop()
    const b = pop()
    push({name:"bool", data:(a.data && b.data)})
}
const or = () => { //||
    const a = pop()
    const b = pop()
    push({name:"bool", data:(a.data || b.data)})
}
const not = () => { //!
    const a = pop()
    push({name:"bool", data:!a.data})
}

const plus = () => { //+
    const a = pop()
    const b = pop()
    if(a.name == "string" && b.name == "string"){
        push({name:"string", data:(a.data + b.data)})
    } else {
        push({name:"number", data:(a.data + b.data)})
    }
}
const minus = () => { //-
    const a = pop()
    const b = pop()
    push({name:"number", data:(b.data - a.data)})
}
const times = () => { //*
    const a = pop()
    const b = pop()
    push({name:"number", data:(a.data * b.data)})
}
const div = () => { // /
    const a = pop()
    const b = pop()
    push({name:"number", data:(b.data / a.data)})
}
const rem = () => { // %
    const a = pop()
    const b = pop()
    push({name:"number", data:(b.data % a.data)})
}

//COMBINATORS
const show = () => console.log(pop())

function matchArgs(template, actual, ctx) {
    switch(template.name) {
        case "bool":
        case "number":
        case "string":
            if (actual.name != template.name || template.data != actual.data)
                return false
            break;
        case "variable":
            ctx[template.data] = actual
            return true
        case "placeholder":
            return true
        case "list":
            return matchList(template, actual, ctx)
        case "object":
            return matchObject(template, actual, ctx)
    }
    return true
}


function matchList(template, actual, ctx) {
    if (actual.name != template.name)
        return false

    if (template.data.length == 0)
        return actual.data.length == 0

    for(let i = 0; i < template.data.length; i++)
    {
        const symbol = template.data[i]
        if(symbol.name == "rest_of_list") {
            ctx[symbol.data] = {name:"list", data:actual.data.slice(i)}
            return true;
        }

        if( i >= actual.data.length)
            return false
        
        let ok = matchArgs(symbol, actual.data[i], ctx)
        if(!ok)
            return false;
    }
    return true
}

function matchObject(template, actual, ctx) {
    if (actual.name != template.name)
        return false

    if (template.data.length == 0)
        return actual.data.length == 0

    let mustHaveKeys = 0
    for(let i = 0; i < template.data.length; i++)
    {
        const symbol = template.data[i]
        if(symbol.name == "_") {
            if(symbol.data.name == "placeholder") {
                mustHaveKeys++
            } else {
                //search a match value
                let success = false
                for(const foundSymbol of actual.data) {
                    success = matchArgs(symbol.data, foundSymbol.data, ctx)
                    if(success)
                        break
                }
                if(!success)
                    return false
            }
        } else {
            let success = false
            for(const foundSymbol of actual.data) {
                if (foundSymbol.name == symbol.name){
                    success = matchArgs(symbol.data, foundSymbol.data, ctx)
                    if(success)
                        ctx[symbol.name] = foundSymbol.data
                    break
                }
            }
            if(!success)
                return false
        }
    }

    if (mustHaveKeys)
        return actual.data.length >= mustHaveKeys

    return true
}

function calculateCtx(f) {
    if(f.arguments.length > data.length)
        throw "stack exhausted"

    const newCtx = {}

    const actualArgs = []
    for(let i = 0; i < f.arguments.length; i++)
        actualArgs.unshift(data.pop())

    let success = true
    for(let i = 0; i < f.arguments.length; i++) {
        success = success && matchArgs(f.arguments[i], actualArgs[i], newCtx)
        if(!success)
            break
    }

    if(!success) {
        for(const symbol of actualArgs)
            data.push(symbol)
    } else {
        if (Object.keys(newCtx).length > 0) {
            ctx.push(newCtx)
            //code.push({name:"native", data:removeCtx})
        }
    }
    

    return success
}

function executeOperator(name) {
    const opTable = {
        "."  : apply,
        ":"  : ocons,
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


function substituteVars(enumerable, ctx) {
    if (enumerable.name == "variable") {
        const v = currentCtx()[enumerable.data]
        const vCopy = JSON.parse(JSON.stringify(v))
        enumerable.name = vCopy.name;
        enumerable.data = vCopy.data;
    } else if(enumerable.name == "list") {
        for (const item of enumerable.data) {
            substituteVars(item, ctx)
        }
    } else if (enumerable.name == "object") {
        for(const f of enumerable.data) {
            substituteVars(f.data, ctx)
        }
    }
}

function pushCode(f, ctx) {
    for(let i = f.body.length - 1; i >= 0; i--) {
        const symbol = f.body[i]
        const copySymbol = JSON.parse(JSON.stringify(symbol))
        substituteVars(copySymbol, ctx)
        code.push(copySymbol)
    }
}

function evaluate(program, debug = false) {
    if(debug) {
        console.log("----------------------------")
    }
    
    code.push({name:"function", data:"main"})

    while(code.length > 0) {
        if(debug) {
            console.log("CODE = ", util.inspect(code, false, null, false/*true*/))
            //console.log("CTX =  ", util.inspect(currentCtx(), false, null, false/*true*/))
            console.log("DATA = ", util.inspect(data, false, null, false/*true*/))
            console.log("----------------------------")
        }
        const symbol = code.pop();

        switch(symbol.name) {
            case "bool":
            case "number":
            case "string":
            case "list":
            case "object":
                const symbolCopy = JSON.parse(JSON.stringify(symbol))
                data.push(symbolCopy)
                break
            case "function":
                let success = false
                for(const fn of program) {
                    if (fn.name == symbol.data) {
                        if(calculateCtx(fn)) {
                            pushCode(fn, currentCtx())
                            removeCtx()
                            success = true
                            break
                        }
                    }
                }
                if(!success) {
                    console.log("No stack match for function: ", symbol.data)
                    console.log("DATA = ", util.inspect(data, false, null, false/*true*/))
                    return
                }
                break
            case "operator":
                executeOperator(symbol.data)
                break
            case "native":
                symbol.data()
                break
        }
    }

    console.log("DATA = ", util.inspect(data, false, null, false/*true*/))
}

module.exports = {
    evaluate
}