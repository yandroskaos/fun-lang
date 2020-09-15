function onelineComment (input, head) {
    if(input[head] != "/" || input[head + 1] != "/") 
        return head
        
    head += 2
    while(head < input.length) {
        if(input[head] == "\n")
            return head + 1

        head++
    }

    return head;
}

function anidatedMultilineComments (input, head) {
    if(input[head] != "/" || input[head + 1] != "*") 
        return head
        
    head += 2
    while(head < input.length) {
        if(input[head] == "*" && input[head + 1] == "/")
            return head + 2

        if(input[head] == "/" && input[head + 1] == "*")
            head = anidatedMultilineComments(input, head)
        else
            head++
    }

    return head;
}

function spaces(input, head) {
    const pattern_spaces   = /^\s*/;
    const spaces = input.slice(head).match(pattern_spaces);
    if(spaces)
        head += spaces[0].length;
    
    return head;
}

function lint(input, head) {
    let previous_head;
    do {
        previous_head = head
        head = spaces(input, head)
        head = onelineComment(input, head)
        head = anidatedMultilineComments(input, head)
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
        ["ID", /^[<>:=\+\-\*\/%!&|]{2,}/],
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
    while(head < input.length) {
        head = lint(input, head);

        let token_found = false
        for(token of tokens) {
            const result = input.slice(head).match(token[1]);
            if(result) {
                token_found = true
                head += result[0].length;
                yield {id:token[0], lexeme:result[0]} 
                break;
            }
        }

        if(!token_found){
            if(head == input.length){
                return {id:"END", lexeme:"END"} 
            } else {
                head++;
                yield {id:"ERROR", lexeme:input[head - 1]}
            }
        }
    }
    return {id:"END", lexeme:"END"} 
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
