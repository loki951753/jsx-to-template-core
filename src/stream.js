class Stream {
    constructor(tokens){
        if(!Array.isArray(tokens)){
            throw new TypeError('tokens must be passed to Stream as an array');
        }
        this._tokens = tokens;
    }
    peek(){
        if(this._tokens.length === 0){
            return;
        }
        return this._tokens[0];
    }
    next(){
        if(this._tokens.length === 0){
            throw new Error('Cannot read past the end of a stream');
        }
        return this._tokens.shift();
    }
}

module.exports = Stream;