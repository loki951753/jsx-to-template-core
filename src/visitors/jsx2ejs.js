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
        // [TYPE.IDENTIFIER]: function(token){
        //     return packVar(token);
        // },
        // [TYPE.MEMBER]: function(token){
        //     return packVar(token);
        // },
        // [TYPE.LITERAL]: function(token){
        //     return token.val;
        // },
        [TYPE.INTERPOLATION]: function(token){
            return `<%= ${packVar(token.val)} %>`;
        },
        [TYPE.CONDITION]: function(node){
            let buf = [];
            let consequent = node.consequent;
            let alternate = node.alternate;
    
            buf.push(`<% if(${packVar(node.test)}){ %>`);
            if(consequent.length !== 0){
                if(consequent.length === 1 && consequent[0].type === TYPE.PLAIN){
                    buf.push(consequent[0].val);
                } else {
                    let g = new Generator(consequent, jsx2ejsVisitor);
                    buf.push(g.gen());
                }
            }

            if(alternate.length !== 0){
                buf.push('<% } else { %>')
                if(alternate.length === 1 && alternate[0].type === TYPE.PLAIN){
                    buf.push(alternate[0].val);
                }else{
                    let g = new Generator(alternate, jsx2ejsVisitor);
                    buf.push(g.gen());
                }
            }
            buf.push('<% } %>'); // the close tag of if

            return buf.join('');
        },
        [TYPE.FOREACH]: function(node){
            let buf = [];
            let dataset = packVar(node.dataset);
            let item = node.item;
            let index = node.index || 'index';

            buf.push('<% (function(){ ');
            buf.push(`var ${item};`);
            buf.push(`for(var ${index}=0; ${index}<${dataset}.length; ++${index}){`);
            buf.push(`${item}=${dataset}[${index}]; %>`);
            
            let g = new Generator(node.statement, jsx2ejsVisitor);
            let statement = g.gen();

            buf.push(statement);
            buf.push(`\n<% }})() %>`);

            return buf.join('');
        },
        [TYPE.CUSTOM_COMPONENT]: function(node){
            // let buf = [];
            // let customComHasDeclared = coms.some(({ast, code, tags})=>{
            //     if(tags.name === node.name){
            //         if(code){
            //             buf.push(code);
            //         }else{
            //             let g = new Generator(ast, jsx2ejsVisitor);
            //             let statement = g.gen();
            //             buf.push(statement);
            //         }
            //         return true;
            //     }
            // });
            // if(!customComHasDeclared){
            //     throw new Error('Using a undeclared custom component');
            // }

            // return buf.join('');

            return `###${node.name}###`;
        }
    }
};

module.exports = jsx2ejsVisitor;