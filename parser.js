const {
    success,
    fail,
    
    eoi,

    match,
    ignore,
    
    backtrack,
    
    at,
    notAt,
    optional,
    star,
    plus,
    sequence,
    choice,
    
    rule
} = require("./combinators")

const compose = (...fns) => initial => {
    let r = initial;
    for(const fn of fns)
        r = fn(r)
    return r
}

const parseBool = str => str == "true"

const parseString = str => str.slice(1, str.length-1)

const prune = list => list.length == 1 ? list[0] : list

const merge = type => list => {
    const [a, b, c] = list

    const hasName = !Array.isArray(a)

    let name = hasName ? a.data : undefined
    let body = hasName ? b : a
    let rest = hasName ? c : b

    const hasRest = rest != undefined

    if(hasRest)
        body.push(rest)

    return hasName ? {name, type, data:body} : {type, data:body}
}

const toField = list => {
    let [name, value] = list

    if (value) {
        value = Array.isArray(value) ? prune(value) : value
    } else {
        value = { type: 'any' }
    }

    return {name, ...value}
}

const toFunction = list => {
    const [pattern, name, body] = list
    return {name, pattern, body}
}

const toExpr = type => data => ({type, data})





const operator          = rule.make()

const expr_symbol       = rule.make()
const expr_bool         = rule.make()
const expr_number       = rule.make()
const expr_string       = rule.make()
const expr_basic        = rule.make()
const expr_list         = rule.make()
const expr_field        = rule.make()
const expr_object       = rule.make()
const expr              = rule.make()

const pattern_placeholder  = rule.make()
const pattern_basic        = rule.make()
const pattern_name         = rule.make()
const pattern_rest         = rule.make()
const pattern_list         = rule.make()
const pattern_field        = rule.make()
const pattern_object       = rule.make()
const pattern              = rule.make()

const function_pattern     = rule.make()
const function_body        = rule.make()
const function_definition  = rule.make()

const program              = rule.make()


rule.set(operator, choice(
    match("."), match(":"), match("::"), match("="),
    match("=="), match("!="), match(">="), match("<="), match(">"), match("<"),
    match("&&"), match("||"), match("!"),
    match("+"), match("-"), match("*"), match("/"), match("%")),
    
    toExpr("operator") );


const aggregate_expr = (open, body, close) => sequence(ignore(open), star(body), ignore(close))

rule.set(expr_symbol, match("ID"),                                           toExpr("symbol")                       );
rule.set(expr_bool,   match("BOOL"),                                         compose(parseBool, toExpr("bool"))     );
rule.set(expr_number, match("NUMBER"),                                       compose(parseInt, toExpr("number"))    );
rule.set(expr_string, match("STRING"),                                       compose(parseString, toExpr("string")) );
rule.set(expr_basic,  choice(expr_bool, expr_number, expr_string, expr_symbol, operator)                            );
rule.set(expr_list,   aggregate_expr("[", expr,"]"),                         compose(prune, toExpr("list"))         );
rule.set(expr_field,  sequence(match("ID"), ignore(":"), expr),              toField                                );
rule.set(expr_object, aggregate_expr("{", expr_field,"}"),                   compose(prune, toExpr("object"))       );
rule.set(expr,        choice(expr_basic, expr_list, expr_object)                                                    );

const aggregate_pattern = (open, body, close) => sequence(optional(pattern_name), ignore(open), star(body), ignore(close), optional(pattern_rest))

rule.set(pattern_placeholder,  match("_"),                                                                          () => ({type:"any"})           );
rule.set(pattern_basic,        choice(pattern_placeholder, expr_basic)                                                                             );
rule.set(pattern_name,         sequence(match("ID"), ignore("@")),                                                  compose(prune, toExpr("name")) );
rule.set(pattern_rest,         sequence(ignore("::"), match("ID")),                                                 compose(prune, toExpr("rest")) );
rule.set(pattern_list,         aggregate_pattern("[", pattern, "]"),                                                merge("list")                  );
rule.set(pattern_field,        sequence(choice(match("ID"), match("_")), optional(sequence(ignore(":"), pattern))), toField                        );
rule.set(pattern_object,       aggregate_pattern("{", pattern_field, "}"),                                          merge("object")                );
rule.set(pattern,              choice(pattern_list, pattern_object, pattern_basic)                                                                 );

rule.set(function_pattern,     sequence(notAt(sequence(match("ID"), ignore("="))), pattern),                prune      );
rule.set(function_body,        sequence(plus(expr), ignore(";")),                                           prune      );
rule.set(function_definition,  sequence(star(function_pattern), match("ID"), ignore("="), function_body ),  toFunction );

rule.set(program, sequence(plus(function_definition), ignore("END")), prune );

const parse = program

module.exports = {
    expr,
    pattern,
    parse
}
