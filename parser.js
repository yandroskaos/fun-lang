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

function toBool(str) {
    return str == "true"
}

function pruneString(str) {
    return str.slice(1, str.length-1);
}

function prune(list) {
    return list.length == 1 ? list[0] : list;
}

const merge = type => list => {
    const hasName = list[0].type != undefined
    const hasRest = list[list.length - 1].type != undefined

    let body = hasName ? list[1] : list[0]

    if(hasRest)
        body.push(list[list.length - 1])

    if(hasName)
        return {name: list[0].data, type, data:body}

    return {type, data:body}
}

function toField(list) {
    return {
        name: list[0], 
        data: list.length == 1 ? { name: 'placeholder', data: '_' } : list[1]
    };
}

function toFunctionDefinition(list) {
    return {
        name: list[1],
        arguments: list[0],
        body: list[2],
    }
}

const toRule = type => data => ({type, data})

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

const function_argument    = rule.make()
const function_definition  = rule.make()
const function_body        = rule.make()
const symbol               = rule.make()


const program              = rule.make()


rule.set(operator, choice(
    match("."), match(":"), match("::"), match("="),
    match("=="), match("!="), match(">="), match("<="), match(">"), match("<"),
    match("&&"), match("||"), match("!"),
    match("+"), match("-"), match("*"), match("/"), match("%")),
    
    toRule("operator") );


const aggregate_expr = (open, body, close) => sequence(ignore(open), star(body), ignore(close))

rule.set(expr_symbol, match("ID"),                                           toRule("symbol")                       );
rule.set(expr_bool,   match("BOOL"),                                         compose(toBool, toRule("bool"))        );
rule.set(expr_number, match("NUMBER"),                                       compose(parseInt, toRule("number"))    );
rule.set(expr_string, match("STRING"),                                       compose(pruneString, toRule("string")) );
rule.set(expr_basic,  choice(expr_bool, expr_number, expr_string, expr_symbol, operator)                            );
rule.set(expr_list,   aggregate_expr("[", expr,"]"),                         compose(prune, toRule("list"))         );
rule.set(expr_field,  sequence(match("ID"), ignore(":"), expr),              toField                                );
rule.set(expr_object, aggregate_expr("{", expr_field,"}"),                   compose(prune, toRule("object"))       );
rule.set(expr,        choice(expr_basic, expr_list, expr_object)                                                    );

const aggregate_pattern = (open, body, close) => sequence(optional(pattern_name), ignore(open), star(body), ignore(close), optional(pattern_rest))

rule.set(pattern_placeholder,  match("_"),                             toRule("placeholder")          );
rule.set(pattern_basic,        choice(pattern_placeholder, expr_basic)                                );
rule.set(pattern_name,         sequence(match("ID"), ignore("@")),     compose(prune, toRule("name")) );
rule.set(pattern_rest,         sequence(ignore("::"), match("ID")),    compose(prune, toRule("rest")) );
rule.set(pattern_list,         aggregate_pattern("[", pattern, "]"),   merge("list") );
rule.set(pattern_field,        choice(
                                   sequence(choice(match("ID"), match("_")), ignore(":"), pattern),
                                   sequence(match("ID"))),
                               toField                                                                );
rule.set(pattern_object,       aggregate_pattern("{", pattern_field, "}"), merge("object")            );
rule.set(pattern,              choice(pattern_list, pattern_object, pattern_basic)                    );


rule.set(function_argument,    sequence(notAt(sequence(match("ID"), ignore("="))), pattern),                 prune                );
rule.set(function_definition,  sequence(star(function_argument), match("ID"), ignore("="), function_body ),  toFunctionDefinition );
rule.set(function_body,        sequence(plus(choice(symbol, expr, operator)), ignore(";")),               prune                );
rule.set(symbol,               match("ID"),                                                                  toRule("symbol")     );

rule.set(program, sequence(plus(function_definition), ignore("END")), prune );

const parse = program

module.exports = {
    expr,
    pattern,
    parse
}
