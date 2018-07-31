/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:41:09 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-31 20:24:35
 */

const fs = require('fs');
const path = require('path');
const Parser = require('./parser');
const transform = require('./transform');
const Generator = require('./generator');


var compile = function(str, visitor, options){
    let parser = new Parser(str, options);
    // let ast = parser.parse().ast;
    let comsInfo = parser.validate();

    if(!comsInfo || comsInfo.length === 0) return;

    // 同一文件中可能有多个标记
    let result = [];
    comsInfo.forEach(({ast, path, tags})=>{
        let templateAst = transform(path);
        let generator = new Generator(templateAst.program.body, visitor);
    
        let code = generator.gen();
        result.push({
            comInfo: tags,
            code
        });
    });

    return result;
};

var compileFile = function(filepath, visitor, options){
    var str = fs.readFileSync(filepath, 'utf8');

    return compile(str, visitor, options);
};

var compileBy = (visitor)=>(str, options)=>compile(str, visitor, options);

exports.compile = compile;
exports.compileFile = compileFile;
exports.compileBy = compileBy;