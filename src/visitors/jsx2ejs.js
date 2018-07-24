const { TYPE } = require('../type');
const Generator = require('../generator');

const packVar = function(token){
    if(token.type === TYPE.MEMBER){
        return token.val.join('.');
    } else {
        return token.val;
    }
}

const jsx2ejsVisitor = function(){
    return {
        [TYPE.PLAIN]: function(token){
            return token.val;
        },
        [TYPE.MEMBER]: function(token){
            return packVar(token);
        },
        [TYPE.LITERAL]: function(token){
            return token.val;
        },
        [TYPE.INTERPOLATION]: function(token){
            return `<%= ${packVar(token.val)} %>`;
        },
        [TYPE.CONDITION]: function(node){
            let buf = [];
            let consequent = node.consequent;
            let alternate = node.alternate;
    
            buf.push(`<% if(${packVar(node.test)}){ %>`);
            if(consequent){
                if(consequent.length === 1 && consequent[0].type === TYPE.PLAIN){
                    buf.push(consequent[0].val);
                }else{
                    let g = new Generator(consequent, jsx2ejsVisitor);
                    buf.push(g.gen());
                }
            }

            if(alternate){
                buf.push('<% } else { %>')
                if(alternate.length === 1 && alternate[0].type === TYPE.PLAIN){
                    buf.push(alternate[0].val);
                }else{
                    let g = new Generator(alternate, jsx2ejsVisitor);
                    buf.push(g.gen());
                }
                buf.push('<% } %>');
            }else{
                buf.push('<% } %>'); // the close tag of if
            }

            return buf.join('');
        }
    }
};

module.exports = jsx2ejsVisitor;