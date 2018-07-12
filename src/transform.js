/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:59:54 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-12 14:11:57
 */


const t = require('@babel/types');
const traverse = require('@babel/traverse').default;

const TYPE = require('./type');
const { log } = require('./utils');

function initBlock(){
    return {
        program: {
            loc: {},
            body: []
        }
    }
}

function createToken(type, ...arg){
    if (arg.length === 0) {
        throw new Error('Should pass one arg at least when create token');
    }
    let token;
    switch (type) {
        case TYPE.PLAIN:
            token = {
                type: TYPE.PLAIN,
                val: arg[0]
            }
            break;
        case TYPE.ECHO:
            token = {
                type: TYPE.ECHO,
                val: arg[0]
            }
            break;
    
        default:
            break;
    }

    return token;
}

function expect(node){
    return {
        to: {
            be: (types) => {
                if(Array.isArray(types)){
                    let _type;
                    const vaild = types.some((type)=>{
                        _type = type;
                        return t[`is${type}`](node);
                    })
    
                    if(!vaild){
                        throw new Error(`Expect ${types.join('|')} but got ${_type}`);
                    }
                } else if(typeof types === 'string') {
                    const type = types;
                    if(!t[`is${type}`](node)){
                        throw new Error(`Expect ${type} but got ${node.type}`);
                    }
                }
            }   
        }
    }
}

function getPossibleRaw(node){
    const extra = node.extra;
    if(extra
        && extra.raw != null
        && extra.rawValue != null
        && node.value === extra.rawValue){
        return extra.raw;
    }
}

// merge PLAIN token
function mergeTokens(tokens){
    let newTokens = [];
    let buf = [];
    let cur;

    function clearBuf(){
        if(buf.length !== 0){
            newTokens.push(createToken(TYPE.PLAIN, buf.join('')));
            buf.length = 0;
        }
    }

    while(cur = tokens.shift()){
        if(cur.type === TYPE.PLAIN){
            buf.push(cur.val);
        } else {
            clearBuf();
            newTokens.push(cur);
        }
    }
    clearBuf();

    return newTokens;
}

class Buf {
    constructor(){
        this.buf = [];
    }
    push(token){
        if(Array.isArray(token)){
            this.buf.push(...token);
        } else if ((typeof token === 'object') && (token.type)){
            // @TODO: extend token node to a basenode to check instance
            this.buf.push(token);
        } else {
            throw new Error(`Invalid token`);
        }

        return this;
    }
    get(){
        return this.buf;
    }
}

// @TODO:第一次解析完后，合并连续的PLAIN_STRING
class Visitor {
    constructor(path){
        this.path = path;
        this.ast = initBlock();
    }
    visit(){
        let tokens = this._visit(this.path);
        tokens = mergeTokens(tokens);
        this.ast.program.body = tokens;
        return this.ast;
    }
    _visit(visitedPath){
        const buf = new Buf();
        visitedPath.traverse({
            JSXElement: (path)=>{
                /*
                    {
                        type: "JSXElement";
                        openingElement: JSXOpeningElement;
                        closingElement: JSXClosingElement | null;
                        children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
                        selfClosing: any;
                    }
                */

                const node = path.node;

                // opening tag
                const elementName = node.openingElement.name.name;
                if(path.scope.hasBinding(elementName)){
                    log(`Found custom component being used -> ${elementName}`);

                } else {
                    // normal html element
                    buf.push(createToken(TYPE.PLAIN, `<${elementName}`));
                }

                // attribute
                const attributes = node.openingElement.attributes;
                if(attributes.length !== 0){
                    attributes.forEach((attribute, index)=>{
                        buf.push(this.visitJSXAttribute(path.get('openingElement.attributes')[index]));
                    })
                }

                // self close are not allow
                buf.push(createToken(TYPE.PLAIN, `>`));

                // children
                if(node.children.length > 0){
                    buf.push(this.visitJSXElementChildren(path.get('children')));
                }

                // closing tag
                if(node.openingElement.selfClosing || (!node.closingElement)
                ){
                    // always append a close tag
                    // @TODO: ignore the tags allow selfClosing
                    buf.push(createToken(TYPE.PLAIN, `</${node.openingElement.name.name}>`));                    
                } else if(node.closingElement){
                    buf.push(createToken(TYPE.PLAIN, `</${node.closingElement.name.name}>`));
                }
                
                path.stop();
                return;
            }
        })

        return buf.get();
    }
    visitJSXAttribute(path){
        /*
            {
                type: "JSXAttribute";
                name: JSXIdentifier | JSXNamespacedName;
                value: JSXElement | JSXFragment | StringLiteral | JSXExpressionContainer | null;
            }
        */
        let buf = new Buf();
        const node = path.node;

        expect(node).to.be('JSXAttribute');
        
        // handle attribute's name
        // ignore JSXNamespacedName
        expect(node.name).to.be('JSXIdentifier');
        /* JSXIdentifier
            {
                type: "JSXIdentifier";
                name: string;
            }
        */
        let attributeName = node.name.name;

        if(attributeName === 'className') attributeName = 'class';
        buf.push(createToken(TYPE.PLAIN, ` ${attributeName}`));

        // handle attribute's value
        if(node.value){
            expect(node.value).to.be(['StringLiteral', 'JSXExpressionContainer']);
            buf.push(createToken(TYPE.PLAIN, '='));
            buf.push(this[`visit${node.value.type}`](path.get('value')));
        }

        return buf.get();
    }
    visitJSXExpressionContainer(path){
        // Expression:
        // ArrayExpression | BinaryExpression | CallExpression | ConditionalExpression | Identifier | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | LogicalExpression | MemberExpression | ThisExpression | UnaryExpression | ArrowFunctionExpression | TemplateLiteral | JSXElement
        // ignore: AssignmentExpression | FunctionExpression | RegExpLiteral | NewExpression | ObjectExpression | SequenceExpression | UpdateExpression | ClassExpression | MetaProperty | Super | TaggedTemplateExpression | YieldExpression | TypeCastExpression | JSXFragment | ParenthesizedExpression | AwaitExpression | BindExpression | OptionalMemberExpression | OptionalCallExpression | Import | DoExpression | BigIntLiteral | TSAsExpression | TSTypeAssertion | TSNonNullExpression
        let buf = new Buf();
        let expression = path.node.expression;
        expect(expression).to.be(['ArrayExpression', 'BinaryExpression', 'CallExpression', 'ConditionalExpression', 'Identifier', 'StringLiteral', 'NumericLiteral', 'NullLiteral', 'BooleanLiteral', 'LogicalExpression', 'MemberExpression', 'ThisExpression', 'UnaryExpression', 'ArrowFunctionExpression', 'TemplateLiteral', 'JSXElement']);

        return buf.push(this[`visit${expression.type}`](path.get('expression'))).get();
    }   
    visitJSXElementChildren(pathArray){
        // Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>
        let buf = new Buf();

        pathArray.forEach((path)=>{
            let node = path.node;
            // ignore JSXSpreadChild | JSXFragment
            expect(node).to.be(['JSXText', 'JSXExpressionContainer', 'JSXElement']);
            buf.push(this[`visit${node.type}`](path));
        })

        return buf.get();
    }
    visitIdentifier(path){
        /*
            {
                type: "Identifier";
                name: string;
                decorators: Array<Decorator> | null;
                optional: boolean | null;
                typeAnnotation: TypeAnnotation | TSTypeAnnotation | Noop | null;
            }
        */

        let buf = new Buf();
        let node = path.node;
        // Identifier单独出现在JSXExpressionContainer时，其目的是为了输出变量
        if(t.isJSXExpressionContainer(path.parent)){
            buf.push(createToken(TYPE.ECHO, node.name));
        }

        return buf.get();
    }
    visitStringLiteral(path){
        /*
            {
                type: "StringLiteral";
                value: string;
            }
        */
        //@TODO: add safe ascii
        const raw = getPossibleRaw(path.node);
        if(raw){
            return createToken(TYPE.PLAIN, raw); 
        }
        return createToken(TYPE.PLAIN, path.node.value);
    }
}

/**
 * transform ast to another ast for generate embed template language
 * @param {Object} ast 
 */
function transform(ast){
    let visitor;
    traverse(ast, {
        Program: (path)=>{
            const node = path.node;
            if(node.body.length > 1){
                throw new Error('Multiple nodes in program body are not supported');
            }
            visitor = new Visitor(path.get('body.0'));

            path.stop();
        }
    })

    return visitor.visit();
}

module.exports = transform;