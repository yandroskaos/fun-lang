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

function merge(list) {
    switch(list.length) {
        case 2: list[0].push(list[1])
        case 1: return list[0];
    }

    return list
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

const toRule = name => data => ({name, data})

const literal_symbol       = rule.make()
const literal_bool         = rule.make()
const literal_number       = rule.make()
const literal_string       = rule.make()
const literal_basic        = rule.make()
const literal_list         = rule.make()
const literal_field        = rule.make()
const literal_object       = rule.make()
const literal              = rule.make()

const pattern_variable     = rule.make()
const pattern_placeholder  = rule.make()
const pattern_basic        = rule.make()
const pattern_rest_of_list = rule.make()
const pattern_head_of_list = rule.make()
const pattern_list         = rule.make()
const pattern_field        = rule.make()
const pattern_object       = rule.make()
const pattern              = rule.make()

const function_argument    = rule.make()
const function_definition  = rule.make()
const function_body        = rule.make()
const symbol               = rule.make()
const operator             = rule.make()

const program              = rule.make()

rule.set(literal_symbol, match("ID"),                                              toRule("symbol")                        );
rule.set(literal_bool,   match("BOOL"),                                            compose(toBool, toRule("bool"))         );
rule.set(literal_number, match("NUMBER"),                                          compose(parseInt, toRule("number"))     );
rule.set(literal_string, match("STRING"),                                          compose(pruneString, toRule("string"))  );
rule.set(literal_basic,  choice(literal_bool, literal_number, literal_string, literal_symbol, operator)                    );
rule.set(literal_list,   sequence(ignore("["), star(literal), ignore("]")),        compose(prune, toRule("list"))          );
rule.set(literal_field,  sequence(match("ID"), ignore(":"), literal),              toField                                 );
rule.set(literal_object, sequence(ignore("{"), star(literal_field), ignore("}")),  compose(prune, toRule("object"))        );
rule.set(literal,        choice(literal_basic, literal_list, literal_object)                                               );

rule.set(pattern_variable,     match("ID"),                                                                                    toRule("variable")                     );
rule.set(pattern_placeholder,  match("_"),                                                                                     toRule("placeholder")                  );
rule.set(pattern_basic,        choice(pattern_variable, pattern_placeholder, literal)                                                                                 );
rule.set(pattern_rest_of_list, sequence(ignore("::"), match("ID")),                                                            compose(prune, toRule("rest_of_list")) );
rule.set(pattern_head_of_list, sequence(notAt(pattern_rest_of_list), pattern),                                                 prune                                  );
rule.set(pattern_list,         sequence(ignore("["), star(pattern_head_of_list), optional(pattern_rest_of_list), ignore("]")), compose(merge, toRule("list"))         );
rule.set(pattern_field,        choice(sequence(choice(match("ID"), match("_")), ignore(":"), pattern), sequence(match("ID"))), toField                                );
rule.set(pattern_object,       sequence(ignore("{"), star(pattern_field), ignore("}")),                                        compose(prune, toRule("object"))       );
rule.set(pattern,              choice(pattern_list, pattern_object, pattern_basic)                                                                                    );

rule.set(function_argument,    sequence(notAt(sequence(match("ID"), ignore("="))), pattern),                 prune                );
rule.set(function_definition,  sequence(star(function_argument), match("ID"), ignore("="), function_body ),  toFunctionDefinition );
rule.set(function_body,        sequence(plus(choice(symbol, literal, operator)), ignore(";")),               prune                );
rule.set(symbol,               match("ID"),                                                                  toRule("symbol")     );
rule.set(operator, choice(
    match("."), match(":"), match("::"), match("="),
    match("=="), match("!="), match(">="), match("<="), match(">"), match("<"),
    match("&&"), match("||"), match("!"),
    match("+"), match("-"), match("*"), match("/"), match("%")
    ), toRule("operator") );

rule.set(program, sequence(plus(function_definition), ignore("END")), prune );

const parse = program

module.exports = {
    literal,
    pattern,
    parse
}
