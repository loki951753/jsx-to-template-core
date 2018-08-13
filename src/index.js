/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:41:09 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-08-02 16:51:24
 */

const fs = require('fs');
const path = require('path');
const Parser = require('./parser');
const transform = require('./transform');
const Generator = require('./generator');


var compile = function(str, visitor, options){
    let parser = new Parser(str, options);
    let comsInfo = parser.parse();

    if(!comsInfo || comsInfo.length === 0) return;

    let _visitor;
    if(typeof visitor === 'string'){
        switch (visitor) {
            case 'ejs':
                _visitor = require('./visitors/jsx2ejs');
                break;
            case 'php':
                _visitor = require('./visitors/jsx2php');
                break;
            default:
                break;
        }
    }

    // 同一文件中可能有多个标记
    let result = comsInfo.map(({ ast, path, tags })=>{
        let templateAst = transform(path);
        let generator = new Generator(templateAst.program.body, _visitor);
    
        let code = generator.gen();
        return {
            comInfo: tags,
            code
        };
    });

    // let transformedCom = comsInfo.map(({ ast, path, tags })=>({
    //     ast: transform(path).program.body,
    //     tags,
    //     code: ''
    // }));

    // // 只有等拿到所有组件的ast后才能对子组件进行替换
    // let result = [];
    // transformedCom.forEach(({tags, ast, code}, index)=>{
    //     let generator = new Generator(ast, _visitor, transformedCom);
    
    //     code = generator.gen();
    //     transformedCom[index].code = code;
    //     result.push({
    //         comInfo: tags,
    //         code
    //     });
    // });

    return result;
};

var compileFile = function(filepath, visitor, options){
    var str = fs.readFileSync(filepath, 'utf8');

    return compile(str, visitor, options);
};

var compileBy = (visitor)=>(str, options)=>compile(str, visitor, options);
var compileFileBy = (visitor)=>(filepath, options)=>compileFile(filepath, visitor, options);

exports.compile = compile;
exports.compileFile = compileFile;
exports.compileBy = compileBy;
exports.compileFileBy = compileFileBy;