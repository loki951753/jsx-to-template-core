const Stream = require('./stream');

class Generator {
    constructor(tokens, visitor){
        this.tokens = new Stream(tokens);

        if(typeof visitor === 'function'){
            this.visitor = visitor(); // 这里可以注入变量
        } else if(typeof visitor === 'object'){
            this.visitor = visitor;
        } else {
            throw new Error('Unexcepted visitor type');
        }

        this._buf = [];
    }
    peek(){
        return this.tokens.peek();
    }
    next(){
        return this.tokens.next();
    }
    gen(){
        let node, method;

        while(this.peek()){
            node = this.next();
            method = this.visitor[node.type];
            if(method){
                this._buf.push(method(node));
            } else {
                throw new Error(`Unhandle token: ${node.type}`);
            }
        }

        return this._buf.join('');
    }
}

module.exports =  Generator;