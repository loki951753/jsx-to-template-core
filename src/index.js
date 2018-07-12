/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:41:09 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-10 15:36:28
 */

const path = require('path');
const Parser = require('./parser');
const transform = require('./transform');
const generator = require('./generator');


var compile = function(str, options){
    let parser = new Parser(str, options);
    let ast = parser.parse().ast;

    let templateAst = transform(ast);
    let code = generator(templateAst);

    return code;
}

var compileFile = function(filepath, options){
    var str = fs.readFileSync(filepath);

    return compile(str, options);
}

exports.compile = compile;
exports.compileFile = compileFile;