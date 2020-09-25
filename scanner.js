function updateWhere(charOrStr, where) {
    for (const c of charOrStr) {
        if (c == "\n")  {
            where.line += 1;
            where.column = 1;
        } else {
            where.column += 1
        }
    }
}

function onelineComment (input, head, where) {
    if(input[head] != "/" || input[head + 1] != "/") 
        return head
        
    head += 2
    while(head < input.length) {
        updateWhere(input[head], where)

        if(input[head] == "\n") {
            return head + 1
        }

        head++
    }

    return head;
}

function anidatedMultilineComments (input, head, where) {
    if(input[head] != "/" || input[head + 1] != "*") 
        return head
        
    head += 2
    while(head < input.length) {
        if(input[head] == "*" && input[head + 1] == "/")
            return head + 2

        if(input[head] == "/" && input[head + 1] == "*") {
            head = anidatedMultilineComments(input, head)
        }
        else {
            updateWhere(input[head], where)

            head++
        }
    }

    return head;
}

function spaces(input, head, where) {
    const pattern_spaces   = /^\s*/;
    const spaces = input.slice(head).match(pattern_spaces);
    if(spaces) {
        updateWhere(spaces[0], where)

        head += spaces[0].length;
    }
    
    return head;
}

function lint(input, head, where) {
    let previous_head;
    do {
        previous_head = head
        head = spaces(input, head, where)
        head = onelineComment(input, head, where)
        head = anidatedMultilineComments(input, head, where)
    }
    while(head > previous_head);
    return head;
}

function* scan(input) {
    const tokens = [
        ["BOOL", /^true/],
        ["BOOL", /^false/],
        ["STRING", /^"[^"]*"/],
        ["NUMBER", /^[0-9]+/],
        ["ID", /^[a-zA-Z][a-zA-Z0-9]*/],
        ["::", /^::/],
        ["==", /^==/],
        ["!=", /^!=/],
        [">=", /^>=/],
        ["<=", /^<=/],
        ["&&", /^&&/],
        ["||", /^\|\|/],
        ["ID", /^[<>=\+\-\*\/%!&|]{2,}/],
        ["@", /^@/],
        ["#", /^#/],
        [".", /^\./],
        [";", /^;/],
        ["[", /^\[/],
        ["]", /^\]/],
        ["{", /^{/],
        ["}", /^}/],
        [":", /^:/],
        [",", /^,/],
        ["_", /^_/],
        ["+", /^\+/],
        ["-", /^-/],
        ["*", /^\*/],
        ["/", /^\//],
        ["%", /^%/],
        ["=", /^=/],
        ["!", /^!/],
        [">", /^>/],
        ["<", /^</],
    ]

    let head = 0;
    const where = {line:1, column:1};
    while(head < input.length) {
        head = lint(input, head, where);

        let token_found = false
        for(token of tokens) {
            const result = input.slice(head).match(token[1]);
            if(result) {
                token_found = true
                head += result[0].length;
                yield {id:token[0], lexeme:result[0], where:JSON.parse(JSON.stringify(where))} 
                updateWhere(result[0], where)
                break;
            }
        }

        if(!token_found){
            if(head == input.length){
                return {id:"END", lexeme:"END", where:JSON.parse(JSON.stringify(where))} 
            } else {
                head++;
                yield {id:"ERROR", lexeme:input[head - 1], where:JSON.parse(JSON.stringify(where))}
                updateWhere(input[head - 1], where)
            }
        }
    }

    return {id:"END", lexeme:"END", where:JSON.parse(JSON.stringify(where))} 
}


module.exports = {
    scan(input) {
        return {
            scanner: scan(input),
            head: 0,
            tokens: [],
            contexts: [],

            openContext() {
                this.contexts.push(this.head)
            },
        
            closeContext(success) {
                current = this.contexts.pop()
                if(!success) {
                    this.head = current
                }
            },
        
            get() {
                let token;
                if (this.head == this.tokens.length) {
                    token = this.scanner.next().value
                    this.tokens.push(token)
                } else {
                    token = this.tokens[this.head]
                }
                this.head++;
                return token
            },

            reject(token) {
                this.head--;
            }
        }
    }
}
