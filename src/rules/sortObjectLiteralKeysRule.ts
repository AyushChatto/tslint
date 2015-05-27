/*
 * Copyright 2013 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

export class Rule extends Lint.Rules.AbstractRule {
    public static FAILURE_STRING = "unsorted key '";

    public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
        return this.applyWithWalker(new SortedKeyWalker(sourceFile, this.getOptions()));
    }
}

class SortedKeyWalker extends Lint.RuleWalker {
    private lastSortedKeyStack: string[] = [];
    private sortedStateStack: boolean[] = [];

    public visitObjectLiteralExpression(node: ts.ObjectLiteralExpression): void {
        this.lastSortedKeyStack.push(""); // Char code 0; every string should be >= to this
        this.sortedStateStack.push(true); // Sorted state is always initially true
        super.visitObjectLiteralExpression(node);
        this.lastSortedKeyStack.pop();
        this.sortedStateStack.pop();
    }

    public visitPropertyAssignment(node: ts.PropertyAssignment): void {
        var sortedState = this.sortedStateStack[this.sortedStateStack.length - 1];
        if (sortedState) {
            var lastSortedKey = this.lastSortedKeyStack[this.lastSortedKeyStack.length - 1];
            var keyNode = node.name;
            if (keyNode.kind === ts.SyntaxKind.Identifier) {
                var key = (<ts.Identifier> keyNode).text;
                if (key < lastSortedKey) {
                    var failureString = Rule.FAILURE_STRING + key + "'";
                    this.addFailure(this.createFailure(keyNode.getStart(), keyNode.getWidth(), failureString));
                    this.sortedStateStack[this.sortedStateStack.length - 1] = false;
                } else {
                    this.lastSortedKeyStack[this.lastSortedKeyStack.length - 1] = key;
                }
            }
        }
        super.visitPropertyAssignment(node);
    }
}
