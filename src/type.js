const PLAIN = 'PLAIN'; // 普通语句
const IDENTIFIER = 'IDENTIFIER';
const MEMBER = 'MEMBER';
const LITERAL = 'LITERAL'; // 字面量
const INTERPOLATION = 'INTERPOLATION'; // 插值
const CONDITION = 'CONDITION'; // 条件语句
const CONDITION_END = 'CONDITION_END';
const ELSEIF = 'ELSEIF';
const ELSE = 'ELSE';
const FOREACH = 'FOREACH'; // 循环语句


module.exports.BASIC_TYPE = [IDENTIFIER, MEMBER, LITERAL];

module.exports.TYPE = {
    PLAIN,
    IDENTIFIER,
    MEMBER,
    LITERAL,
    INTERPOLATION,
    CONDITION,
    CONDITION_END,
    ELSEIF,
    ELSE,
    FOREACH   
}