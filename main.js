const fs = require('fs');

const {scan } = require("./scanner");
const {parse} = require("./parser");
const {check} = require("./semantic");
const {evaluate} = require("./vm");

const args = process.argv.slice(2);

const debug = args[1] == "debug"
fs.readFile(
    args[0],
    function(err, data) { 
        if (err) throw err;
        const input = data.toString('utf8')
        const result = parse(scan(input))
        if(result.match && check(result.ast)) {
            evaluate(result.ast, debug)
        } else {
            console.log("bad input")
        }
});
