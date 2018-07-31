/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:59:50 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-31 17:38:55
 */

const babelParser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const plugins = [
    'jsx',
    'decorators-legacy',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'asyncGenerators',
    'functionBind',
    'functionSent',
    'dynamicImport',
    'numericSeparator',
    'optionalChaining',
    'importMeta',
    'bigInt',
    'optionalCatchBinding',
    'throwExpressions',
    'pipelineOperator',
    'nullishCoalescingOperator'
];

class Parser{
    constructor(str, options){
        this.str = str;
        this.options = options;
    }
    validate(){
        const ast = this.parse();
        const _this = this;
        let comsInfo = [];
        
        traverse(ast, {
            JSXElement(path){
                // every transpiling tag should be in the JSX first comment in the render function
                let node = path.node;
                if((!node.leadingComments) || (node.leadingComments.length < 1)){
                    path.stop();
                    return;
                }

                let firstComment = node.leadingComments[0].value;

                /*
                 * transpiling tag
                 * @jsx2tpl: ComponentName[, mount:mountNodeSelector][, data:templateData]
                 */
                let matched = firstComment.match(/@jsx2tpl:(.+)/);
                if(!matched){
                    path.stop();
                    return;
                }
                path.stop();
                comsInfo.push({
                    ast,
                    path,
                    tags: _this.parseTag(matched[1])
                });
            }
        });

        return comsInfo;
    }
    parseTag(str){
        let tagInfo = {};
        const tagArr = str.split(',');

        tagInfo.name = tagArr.shift();
        tagArr.forEach((tag)=>{
            let tagItemArr = tag.trim().split(':');
            tagInfo[tagItemArr[0]] = tagItemArr[1];
        });

        return tagInfo;
    }
    parse(){
        const ast = babelParser.parse(this.str, {
            sourceType: 'module',
            plugins: plugins
        });

        return ast;
    }
}

module.exports = Parser;