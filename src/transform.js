/*
 * @Author: loki951753@gmail.com 
 * @Date: 2018-07-10 11:59:54 
 * @Last Modified by: loki951753@gmail.com
 * @Last Modified time: 2018-07-24 21:09:21
 */


const t = require('@babel/types');
const traverse = require('@babel/traverse').default;

const {TYPE, BASIC_TYPE} = require('./type');
const { log } = require('./utils');

const supportedExpressionType = ['ArrayExpression', 'BinaryExpression', 'CallExpression', 'ConditionalExpression', 'Identifier', 'StringLiteral', 'NumericLiteral', 'NullLiteral', 'BooleanLiteral', 'LogicalExpression', 'MemberExpression', 'ThisExpression', 'UnaryExpression', 'ArrowFunctionExpression', 'TemplateLiteral', 'JSXElement'];

function initBlock(){
    return {
        program: {
            loc: {},
            body: []
        }
    }
}

function createToken(type, ...arg){
    let token;
    switch (type) {
        case TYPE.PLAIN:
            token = {
                type: TYPE.PLAIN,
                val: arg[0]
            }
            break;
        case TYPE.IDENTIFIER:
            token = {
                type: TYPE.IDENTIFIER,
                val: arg[0]
            }
            break;
        case TYPE.MEMBER:
            token = {
                type: TYPE.MEMBER,
                val: arg
            }
            break;
        case TYPE.LITERAL:
            token = {
                type: TYPE.LITERAL,
                val: arg[0]
            }
            break;
        case TYPE.INTERPOLATION:
            token = {
                type: TYPE.INTERPOLATION,
                val: arg[0]
            }
            break;
        case TYPE.CONDITION:
            token = {
                type: TYPE.CONDITION,
                test: null,
                consequent: [],
                alternate: []
            } 
            break;
        case TYPE.FOREACH:
            token = {
                type: TYPE.FOREACH,
                dataset: null,
                index: null,
                item: null,
                statement: []
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
                    const vaild = types.some((type)=>{
                        return t[`is${type}`](node);
                    })
    
                    if(!vaild){
                        throw new Error(`Expect ${types.join('|')} but got ${node.type}`);
                    }
                } else if(typeof types === 'string') {
                    const type = types;
                    if(!t[`is${type}`](node)){
                        throw new Error(`Expect ${type} but got ${node.type}`);
                    }
                }
            },
            equal: (vals) => {
                let val = node; // rename
                if(Array.isArray(vals)){
                    const valid = vals.indexOf(val) > -1;

                    if(!valid){
                        throw new Error(`Expect ${ValidityState.join('|')} but got ${val}`);
                    }
                } else if(typeof vals === 'string' || typeof vals === 'boolean'){
                    if(vals !== val){
                        throw new Error(`Expect ${vals} but got ${val}`);
                    }
                }
            }
        },
        should: {
            notbe: (type) => {
                if(typeof types === 'string'){
                    const type = types;
                    if(t[`is${type}`](node)){
                        throw new Error(`${type} should not be`);
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

            if(typeof cur === 'object'){
                Object.keys(cur).forEach((prop)=>{
                    if(Array.isArray(cur[prop]) && (cur[prop].length !== 0)){
                        cur[prop] = mergeTokens(cur[prop]);
                    }
                })
            }

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
            throw new Error(`Invalid token: ${token}`);
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
        tokens = JSON.parse(JSON.stringify(tokens)); // clone tokens 
        tokens = mergeTokens(tokens);
        this.ast.program.body = tokens;
        return this.ast;
    }
    _visit(visitedPath){
        const buf = new Buf();
        visitedPath.traverse({
            JSXElement: (path)=>{     
                buf.push(this.visitJSXElement(path));
                path.stop();
                return;
            }
        })

        return buf.get();
    }
    getVisitMethod(name){
        const visitMethod = this[`visit${name}`];
        if(!visitMethod){
            throw new ReferenceError(`Unsupport node of type ${name}`);
        }
        return visitMethod.bind(this);
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

            buf.push(createToken(TYPE.PLAIN, '"'));
            if(t.isJSXExpressionContainer(node.value)){
                buf.push(this.getVisitMethod(node.value.type)(path.get('value')));
            } else {
                // StringLiteral
                buf.push(createToken(TYPE.PLAIN, node.value.value));
            }
            buf.push(createToken(TYPE.PLAIN, '"'));
        }

        return buf.get();
    }
    visitJSXElement(path){
        /*
            {
                type: "JSXElement";
                openingElement: JSXOpeningElement;
                closingElement: JSXClosingElement | null;
                children: Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>;
                selfClosing: any;
            }
        */

        let buf = new Buf();
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

        return buf.get();
    }
    visitJSXEmptyExpression(path){
        return;
    }
    visitJSXExpressionContainer(path){
        // Expression:
        // ArrayExpression | BinaryExpression | CallExpression | ConditionalExpression | Identifier | StringLiteral | NumericLiteral | NullLiteral | BooleanLiteral | LogicalExpression | MemberExpression | ThisExpression | UnaryExpression | ArrowFunctionExpression | TemplateLiteral | JSXElement
        // 特殊： JSXEmptyExpression
        // ignore: AssignmentExpression | FunctionExpression | RegExpLiteral | NewExpression | ObjectExpression | SequenceExpression | UpdateExpression | ClassExpression | MetaProperty | Super | TaggedTemplateExpression | YieldExpression | TypeCastExpression | JSXFragment | ParenthesizedExpression | AwaitExpression | BindExpression | OptionalMemberExpression | OptionalCallExpression | Import | DoExpression | BigIntLiteral | TSAsExpression | TSTypeAssertion | TSNonNullExpression
        let buf = new Buf();
        let expression = path.node.expression;
        expect(expression).to.be([...supportedExpressionType, 'JSXEmptyExpression']);

        let tokens = this.getVisitMethod(expression.type)(path.get('expression'));

        if(tokens){
            // Identifier, MemberExpression单独出现在JSXExpressionContainer中是为了打印输出
            if(['Identifier', 'MemberExpression'].indexOf(expression.type) !== -1){
                tokens = createToken(TYPE.INTERPOLATION, tokens);
                buf.push(tokens);
            }else if(['TemplateLiteral', 'StringLiteral'].indexOf(expression.type) !== -1){
                buf.push(tokens);
            }else{
                buf.push(tokens);
            }
    
            return buf.get();
        }
    }   
    visitJSXElementChildren(pathArray){
        // Array<JSXText | JSXExpressionContainer | JSXSpreadChild | JSXElement | JSXFragment>
        let buf = new Buf();

        pathArray.forEach((path)=>{
            let node = path.node;
            // ignore JSXSpreadChild | JSXFragment
            expect(node).to.be(['JSXText', 'JSXExpressionContainer', 'JSXElement']);

            let result = this.getVisitMethod(node.type)(path);
            result && buf.push(result);
        })

        return buf.get();
    }
    visitJSXText(path){
        /*
            {
                type: "JSXText";
                value: string;
            }
        */
        const raw = getPossibleRaw(path.node);
        if(raw){
            return createToken(TYPE.PLAIN, raw);
        }
        return createToken(TYPE.PLAIN, path.node.value);
    }
    visitCallExpression(path){
        /*
            {
                type: "CallExpression";
                callee: Expression;
                arguments: Array<Expression | SpreadElement | JSXNamespacedName>;
                optional: true | false | null;
                typeArguments: TypeParameterInstantiation | null;
                typeParameters: TSTypeParameterInstantiation | null;
            }
        */

        let node = path.node;
        
        // only support map function now, like
        /*
            data.map((i)=><li>{i}</li>)
        */
        expect(node.callee).to.be('MemberExpression'); 
        expect(node.arguments.length).to.equal(1);
        expect(node.arguments[0]).to.be('ArrowFunctionExpression');
        expect(node.arguments[0].body).to.be('JSXElement'); // 仅支持立刻放回JSX元素的语句，不支持额外逻辑，防止引入js runtime逻辑

        expect(node.callee.property.name).to.equal('map'); // only support map now. extend here to support more function or native function

        let token = createToken(TYPE.FOREACH);

        // 获取循环的形参
        // map(item, index)
        const params = node.arguments[0].params.map((paramNode)=>paramNode.name);
        token.item = params[0];
        token.index = (params.length > 1) && params[1];

        // transform dataset
        expect(node.callee.object).to.be(['Identifier', 'MemberExpression']);
        let datasetTokens = this.getVisitMethod(node.callee.object.type)(path.get('callee.object'));
        token.dataset = datasetTokens;

        // statement
        let statementTokens = this.getVisitMethod(node.arguments[0].body.type)(path.get('arguments.0.body'));
        token.statement = statementTokens;

        return token;
    }
    visitConditionalExpression(path){
        /*
            {
                type: "ConditionalExpression";
                test: Expression;
                consequent: Expression;
                alternate: Expression;
            }
        */
        let node = path.node;
        let token = createToken(TYPE.CONDITION);

        // test
        expect(node.test).to.be(['Identifier', 'LogicalExpression', 'MemberExpression', 'UnaryExpression']);
        let testTokens = this.getVisitMethod(node.test.type)(path.get('test'));
        if(!testTokens || testTokens.length === 0){
            return;
        }
        token.test = testTokens;

        // @TODO: expect branch's type
        let consequentTokens = this.getVisitMethod(node.consequent.type)(path.get('consequent'));
        let alternateTokens = this.getVisitMethod(node.alternate.type)(path.get('alternate'));

        // @TODO: handle null, ''
        Array.isArray(consequentTokens) ? token.consequent.push(...consequentTokens)
                                        : token.consequent.push(consequentTokens)
        Array.isArray(alternateTokens) ? token.alternate.push(...alternateTokens)
                                        : token.alternate.push(alternateTokens);

        return token;
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

        let node = path.node;
        let token = createToken(TYPE.IDENTIFIER, node.name);

        return token;
    }
    visitLogicalExpression(path){
        /*
            {
                type: "LogicalExpression";
                operator: "||" | "&&" | "??";
                left: Expression;
                right: Expression;
            }
        */
        
        let node = path.node;
        let token = createToken(TYPE.CONDITION);

        // test
        expect(node.operator).to.equal(['||', '&&']);

        let leftTokens = this.getVisitMethod(node.left.type)(path.get('left'));
        let rightTokens = this.getVisitMethod(node.right.type)(path.get('right'));
        token.test = leftTokens;

        // 条件分支单独出现基础类型时，需要打印输出
        if(BASIC_TYPE.indexOf(leftTokens.type) !== -1){
            leftTokens = createToken(TYPE.INTERPOLATION, leftTokens);
        }
        if(BASIC_TYPE.indexOf(rightTokens.type) !== -1){
            rightTokens = createToken(TYPE.INTERPOLATION, rightTokens);
        }

        if(node.operator === '||'){
            Array.isArray(leftTokens) ? token.consequent.push(...leftTokens)
                                        : token.consequent.push(leftTokens)
            Array.isArray(rightTokens) ? token.alternate.push(...rightTokens)
                                        : token.alternate.push(rightTokens);
        } else {
            Array.isArray(leftTokens) ? token.alternate.push(...leftTokens)
                                        : token.alternate.push(leftTokens)
            Array.isArray(rightTokens) ? token.consequent.push(...rightTokens)
                                        : token.consequent.push(rightTokens);
        }

        return token;
    }
    visitMemberExpression(path){
        /*
            {
                type: "MemberExpression";
                object: Expression;
                property: any;
                computed: boolean;
                optional: true | false | null;
            }
        */

        let node = path.node;

        let memberElements = [];
        let curPath = path;
        let curNode;
        while(t.isMemberExpression(curNode = curPath.node)){
            // computed property may bring the problem of js runtime caculate
            expect(node.computed).to.equal(false);
            // optional property are not supported
            expect(node.optional).to.equal(undefined);

            expect(node.property).to.be('Identifier');

            memberElements.unshift(curNode.property.name);
            curPath = curPath.get('object');
        }

        // @TODO: 处理ThisExpression

        expect(curNode).to.be('Identifier');
        memberElements.unshift(curNode.name);

        return createToken(TYPE.MEMBER, ...memberElements);
    }
    visitStringLiteral(path){
        /*
            {
                type: "StringLiteral";
                value: string;
            }
        */
        //@TODO: add safe ascii
        let token = createToken(TYPE.LITERAL, `"${path.node.value}"`);

        return createToken(TYPE.INTERPOLATION, token);
    }
    visitNumericLiteral(path){
        /*
            {
                type: "NumericLiteral";
                value: number;
            }       
        */
        //@TODO: 比较raw和value进行更精确的数字字面量处理
        return createToken(TYPE.INTERPOLATION, createToken(TYPE.LITERAL, path.node.value));
    }
    visitTemplateLiteral(path){
        /*
            TemplateLiteral {
                type: "TemplateLiteral";
                quasis: Array<TemplateElement>;
                expressions: Array<Expression>;
            }

            TemplateElement {
                type: "TemplateElement";
                value: any;
                tail: boolean;
            }
        */

        let node = path.node;
        let quasis = node.quasis;
        let expressions = node.expressions;
        let buf = new Buf();

        for(let i = 0; i<quasis.length; i++){
            let val = quasis[i].value.raw;
            if(val){
                val.replace(/"/g, '\"');
                buf.push(createToken(TYPE.PLAIN, val));
            }

            if(i + 1 < quasis.length){
                let expression = expressions[i];
                
                let _token = this.getVisitMethod(expressions[i].type)(path.get(`expressions.${i}`));
                if(t.isIdentifier(expression) || t.isMemberExpression(expression)){
                    buf.push(createToken(TYPE.INTERPOLATION, _token));
                } else {
                    buf.push(_token);
                }
            }
        }

        return buf.get();
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