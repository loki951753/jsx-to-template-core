sourcemap暂时不考虑，收益比较低。
解析过程
0. parser.js: 调用@babel/parser生成AST。使用对象而不是函数，用来在做递归解析保存栈。
1. transform.js: 使用visitor转换生成的AST，生成符合assemble template的AST
2. generator.js: 提供访问者接口供第三方调用
3. jsx2php.js, jsx2lua.js