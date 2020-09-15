const success = (ast = undefined) => ({match:true, ast})

const fail = () => ({match:false, ast:undefined})

const token = ignore => token_id => scanner => {
    const token = scanner.get()
    if(token_id != token.id) {
        return fail()
    }
    return ignore ? success() : success(token.lexeme)
}

const match = token(false)

const ignore = token(true)

const eoi = ignore("END")

const backtrack = p => scanner => {
    scanner.openContext()
    const r = p(scanner)
    scanner.closeContext(r.match)
    return r
}

const at = p => scanner => {
    scanner.openContext()
    const r = p(scanner)
    scanner.closeContext(false)
    return r.match ? success() : fail()
}

const notAt = p => scanner => {
    const r = at(p)(scanner)
    return r.match ? fail() : success()
}

const optional = p => scanner => {
    const r = backtrack(p)(scanner)
    return r.match ? r : success()
}

const star = p => scanner => {
    const list = [];
    
    while(true) {
        const r = backtrack(p)(scanner);
        
        if(!r.match)
            break;
        
        if(r.ast)
            list.push(r.ast)
    }

    return success(list)
}

const plus = p => scanner => {
    const first = backtrack(p)(scanner);
    
    if(!first.match)
        return first;

    const more = star(p)(scanner)
    
    return success([first.ast, ...more.ast])
}

const sequence = (...parsers) => scanner => {
    const list = [];
    
    for(const p of parsers) {
        
        const r = backtrack(p)(scanner)
        
        if(!r.match)
            return r

        if(r.ast)
            list.push(r.ast)
    }
    
    return success(list)
}

const choice = (...parsers) => scanner => {
    for(const p of parsers) {
        
        const r = backtrack(p)(scanner)
        
        if(r.match)
            return r
    }

    return fail()
}

const rule = {
    make() {
        const rule = (scanner) => {
            const result = rule.parse(scanner)
            if(result.match && rule.transformAst)
                result.ast = rule.transformAst(result.ast)
            return result
        }

        return rule
    },
    
    set(rule, parser, transformer = undefined) {
        rule.parse = parser
        rule.transformAst = transformer
    }
}

module.exports = {
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
}