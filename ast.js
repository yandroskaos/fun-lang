const astGetFunction = (ast, name) => {
    result = []

    for(const fn of ast.fns) {
        if (fn.name == name) 
            result.push(fn);
    }

    return result;
}

const astFunctionExists = (ast, name) => astGetFunction(ast, name).length > 0;

function objectFindField(object, name) {
    for(const item of object.data) {
        if (item.name == name) {
            return item
        }
    }
    return null
}

module.exports = {
    astGetFunction,
    astFunctionExists,
    objectFindField
}
