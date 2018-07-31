const fs = require('fs');
const path = require('path');
const assert = require('assert');

const jsx2tpl = require('..');
const ejsVisitor = require('../src/visitors/jsx2ejs');
const {TYPE} = require('../src/type');

const read = fs.readFileSync;

/**
 * 
 * load fixture by 'name'
 * @param {*} name 
 */
function fixture(name){
    return read(path.resolve(__dirname, name), 'utf8');
}

// @TODO:
describe('compile jsx to template ast', function(){
});

describe('process', function(){
    const jsx2ejs = jsx2tpl.compileBy(ejsVisitor);
    it('todomvc', function(){
        const str = fixture('fixtures/todomvc.jsx');
        assert.equal(jsx2ejs(str), fixture('ejs/todomvc.ejs'));
    })
})

describe('ejs', function(){
    const jsx2ejs = jsx2tpl.compileBy(ejsVisitor);

    describe('basic', function(){
        it('static jsx', function(){
            const str = fixture('fixtures/basic_static.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/basic_static.ejs'));
        });

        it('selfClosing tag', function(){
            const str = fixture('fixtures/basic_selfclosingtag.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/basic_selfclosingtag.ejs'));
        });
    });

    describe('interpolation', function(){
        it('interpolation::identifier', function(){
            const str = fixture('fixtures/interpolation_identifier.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_identifier.ejs'));
        });
    
        it('interpolation::identifier::inAttribute', function(){
            const str = fixture('fixtures/interpolation_identifier_in_attribute.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_identifier_in_attribute.ejs'));
        });
    
        it('interpolation::member', function(){
            const str = fixture('fixtures/interpolation_member.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_member.ejs'));
        });
    
        it('interpolation::member::inAttribute', function(){
            const str = fixture('fixtures/interpolation_member_in_attribute.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_member_in_attribute.ejs'));
        });
    
        it('interpolation::literal::number', function(){
            const str = fixture('fixtures/interpolation_literal_number.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_literal_number.ejs'));
        });
    
        it('interpolation::literal::string', function(){
            const str = fixture('fixtures/interpolation_literal_string.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/interpolation_literal_string.ejs'));
        });
    });

    describe('comment', function(){
        it('ignore comment', function(){
            const str = fixture('fixtures/comment_ignore.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/comment_ignore.ejs'));
        });
    });

    describe('templateLiteral', function(){
        it('templateLiteral in Attribute', function(){
            const str = fixture('fixtures/templateliteral_in_attribute.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/templateliteral_in_attribute.ejs'));
        });

        it('templateLiteral in JSXExpressionContainer', function(){
            const str = fixture('fixtures/templateliteral_normal.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/templateliteral_normal.ejs'));
        });
    });

    describe('conditional', function(){
        it('conditional operator', function(){
            const str = fixture('fixtures/conditional.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/conditional.ejs'));
        });

        it('short circuit', function(){
            const str = fixture('fixtures/conditional_short_circuit.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/conditional_short_circuit.ejs'));
        });

        it('empty branch:[null, \'\', "", undefined]', function(){
            const str = fixture('fixtures/conditional_empty_branch.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/conditional_empty_branch.ejs'));
        });

        it('nested conditional', function(){
            const str = fixture('fixtures/conditional_nested.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/conditional_nested.ejs'));
        });
    });

    describe('loop', function(){
        it('loop', function(){
            const str = fixture('fixtures/loop.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/loop.ejs'));
        });

        it('nested loop', function(){
            const str = fixture('fixtures/loop_nested.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/loop_nested.ejs'));
        });

        it('nested with other statements', function(){
            const str = fixture('fixtures/loop_with_conditional.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/loop_with_conditional.ejs'));
        });
    });

    describe('misc for coverage', function(){
        it('stream', function(){
            const Stream = require('../src/stream');
            
            assert.throws(function(){
                const stream = new Stream();
            }, TypeError, 'constructor para type check failed');

            assert.throws(function(){
                const stream = new Stream([]);
                stream.next();
            }, Error, 'Stream.next check failed');
        });

        it('compileFile', function(){
            const code = jsx2tpl.compileFile(path.resolve(__dirname, './fixtures/basic_static.jsx'), ejsVisitor);
            assert.equal(code, fixture('ejs/basic_static.ejs'));
        });

        it('Transform', function(){
            assert.throws(function(){
                const code = jsx2tpl.compileFile(path.resolve(__dirname, './fixtures/misc_error_by_multiple_body_children.jsx'), ejsVisitor);
            }, Error);

            assert.throws(function(){
                const code = jsx2tpl.compileFile(path.resolve(__dirname, './fixtures/misc_error_expect_wrong_type.jsx'));
            }, TypeError);

            assert.throws(function(){
                const code = jsx2tpl.compileFile(path.resolve(__dirname, './fixtures/misc_error_expect_wrong_array_type.jsx'));
            }, TypeError);

            assert.throws(function(){
                const code = jsx2tpl.compileFile(path.resolve(__dirname, './fixtures/misc_equal_wrong_array_value.jsx'));
            }, Error);
        });

        it('Generator', function(){
            const Generator = require('../src/generator');
            const tokens = [{
                "type": "PLAIN",
                "val": "<div class=\"cls\"></div>"
            }];
            const visitor = {
                [TYPE.PLAIN]: function(token){
                    return token.val;
                }
            };
            
            const g = new Generator(tokens, visitor);
            assert.equal(g.gen(), `<div class="cls"></div>`);

            assert.throws(function(){
                const g1 = new Generator([{
                    "type": "PLAIN",
                    "val": "<div class=\"cls\"></div>"
                }]);
            }, TypeError);

            assert.throws(function(){
                const g2 = new Generator([{
                    "type": "PLAIN",
                    "val": "<div class=\"cls\"></div>"
                }], {});
                g2.gen();
            }, TypeError);
        })
    });
});
