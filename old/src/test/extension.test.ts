import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractKeywords } from '../extension';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Sample test', () => {
        assert.strictEqual(-1, [1, 2, 3].indexOf(5));
        assert.strictEqual(-1, [1, 2, 3].indexOf(0));
    });

    suite('extractKeywords', () => {
        test('JavaScript: extracts keywords in correct priority order', () => {
            const content = `
                class MyClass {
                    static staticMethod() {}
                    constructor() {
                        this.field = 'value';
                    }
                    method() {}
                }
                function globalFunction() {}
                const GLOBAL_CONST = 'constant';
                var globalVar = 'variable';
                let globalLet = 'let variable';
                const arrowFunc = () => {};
            `;
            const result = extractKeywords(content, 'JavaScript');
            assert.deepStrictEqual(result, ['MyClass', 'globalFunction', 'GLOBAL_CONST', 'globalVar', 'globalLet']);
        });

        test('TypeScript: extracts keywords including TypeScript-specific ones', () => {
            const content = `
                interface MyInterface {}
                type MyType = string;
                enum MyEnum { A, B, C }
                class MyClass implements MyInterface {
                    private field: MyType;
                    constructor() {}
                    method(): void {}
                }
                function globalFunction(): void {}
                const GLOBAL_CONST: number = 42;
            `;
            const result = extractKeywords(content, 'TypeScript');
            assert.deepStrictEqual(result, ['MyClass', 'MyInterface', 'MyType', 'MyEnum', 'globalFunction']);
        });

        test('Python: extracts keywords specific to Python', () => {
            const content = `
                class MyClass:
                    def __init__(self):
                        self.field = 'value'
                    
                    def method(self):
                        pass

                def global_function():
                    pass

                GLOBAL_CONSTANT = 'constant'
                global_variable = 'variable'
            `;
            const result = extractKeywords(content, 'Python');
            assert.deepStrictEqual(result, ['MyClass', 'global_function', 'GLOBAL_CONSTANT', 'global_variable']);
        });

        test('Handles duplicates and limits to 5 keywords', () => {
            const content = `
                class Class1 {}
                class Class2 {}
                class Class3 {}
                class Class4 {}
                class Class5 {}
                class Class6 {}
                function Class1() {} // Duplicate name, should be ignored
            `;
            const result = extractKeywords(content, 'JavaScript');
            assert.deepStrictEqual(result, ['Class1', 'Class2', 'Class3', 'Class4', 'Class5']);
            assert.strictEqual(result.length, 5);
        });

        test('Returns empty array for unsupported language', () => {
            const content = 'Some random content';
            const result = extractKeywords(content, 'UnsupportedLanguage');
            assert.deepStrictEqual(result, []);
        });

        test('Handles empty content', () => {
            const result = extractKeywords('', 'JavaScript');
            assert.deepStrictEqual(result, []);
        });

        test('JavaScript: correctly identifies arrow functions', () => {
            const content = `
                const arrowFunc1 = () => {};
                let arrowFunc2 = (param) => param * 2;
                var regularVar = 'not a function';
            `;
            const result = extractKeywords(content, 'JavaScript');
            assert.ok(result.includes('arrowFunc1'));
            assert.ok(result.includes('arrowFunc2'));
            assert.ok(!result.includes('regularVar'));
        });
    });
});