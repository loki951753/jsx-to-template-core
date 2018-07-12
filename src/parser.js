/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:59:50 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-10 15:41:02
 */

const babelParser = require('@babel/parser');

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
    parse(){
        const ast = babelParser.parse(this.str, {
            sourceType: 'module',
            plugins: plugins
        });

        return {
            ast
        };
    }
}

module.exports = Parser;