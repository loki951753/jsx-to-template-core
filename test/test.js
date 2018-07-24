const fs = require('fs');
const path = require('path');
const assert = require('assert');

const jsx2tpl = require('..');
const ejsVisitor = require('../src/visitors/jsx2ejs');

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

describe('ejs', function(){
    const jsx2ejs = jsx2tpl.compileBy(ejsVisitor);

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
    
        it('static jsx', function(){
            const str = fixture('fixtures/static.jsx');
            assert.equal(jsx2ejs(str), fixture('ejs/static.ejs'));
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
    });
});
