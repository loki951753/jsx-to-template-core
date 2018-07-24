/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:41:09 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-20 11:50:07
 */

const path = require('path');
const Parser = require('./parser');
const transform = require('./transform');
const Generator = require('./generator');


var compile = function(str, visitor, options){
    let parser = new Parser(str, options);
    let ast = parser.parse().ast;

    let templateAst = transform(ast);
    let generator = new Generator(templateAst.program.body, visitor);

    let code = generator.gen();

    return code;
};

var compileFile = function(filepath, visitor, options){
    var str = fs.readFileSync(filepath);

    return compile(str, visitor, options);
};

var compileBy = (visitor)=>(str, options)=>compile(str, visitor, options);

exports.compile = compile;
exports.compileFile = compileFile;
exports.compileBy = compileBy;