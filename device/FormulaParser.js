/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

iotcs.device.impl.FormulaParser = class {
    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} left
     * @param {iotcs.device.impl.FormulaParserNode} right
     * @return {number}
     */
    static _comparePrecedence(left, right) {
        return iotcs.device.impl.FormulaParserOperation._getPrecedence(left._getOperation()) -
            iotcs.device.impl.FormulaParserOperation._getPrecedence(right._getOperation());
    }

    static _dump(node) {
        if (!node) {
            return null;
        }

        if (node instanceof iotcs.device.impl.FormulaParserTerminal) {
            let s = node._getValue();

            if (node.type === iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE) {
                s = "$(".concat(s).concat(")");
            } else if (node.type === iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE) {
                s = "$$(".concat(s).concat(")");
            }

            return s;
        }

        const lhs = iotcs.device.impl.FormulaParser._dump(node.getLeftHandSide());
        const rhs = iotcs.device.impl.FormulaParser._dump(node.getRightHandSide());

        const operation = node._getOperation();
        return "["+operation + "|" + lhs + "|" + rhs + "]";
    }

    //
    // additiveExpression
    //     : multiplicativeExpression (PLUS multiplicativeExpression | MINUS multiplicativeExpression )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<Token>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseAdditiveExpression(stack, tokens, formula, index) {
        if (index >= tokens.size) {
            return tokens.size();
        }

        index = iotcs.device.impl.FormulaParser._parseMultiplicativeExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
        case iotcs.device.impl.FormulaParserToken.Type.PLUS:
            lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.PLUS, stack.pop());
                index += 1;
                break;
        case iotcs.device.impl.FormulaParserToken.Type.MINUS:
            lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MINUS, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // args
    //     : conditionalOrExpression
    //     | conditionalOrExpression COMMA args
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseArgs(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        let previous = null;

        while (index < tokens.size) {
            index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
            let arg = previous === null ? stack.peek() : stack.pop();

            if (previous !== null) {
                previous.setRightHandSide(arg);
            }

            previous = arg;
            const tokensAry = Array.from(tokens);
            const current = tokensAry[index];

            switch (current.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.COMMA:
                    index += 1;
                    break;
                default:
                    return index;
            }
        }

        return index;
    }


//
    // brackettedExpression
    //     : LPAREN conditionalOrExpression RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseBrackettedExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.LPAREN: {
                index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula,
                    index + 1);

                let current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + " expected RPAREN");
                }

                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GROUP, stack.pop()));
                index += 1; // consume RPAREN
            }
        }

        return index;
    }

    //
    // conditionalAndExpression
    //     : valueLogical ( AND valueLogical )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * Takes a formula as a string along with the tokens present in the formula
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseConditionalAndExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseValueLogical(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.AND:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.AND, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalAndExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }


    // conditionalOrExpression
    //     : conditionalAndExpression ( OR conditionalAndExpression )*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseConditionalOrExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalAndExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.OR:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.OR, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // expressionElement
    //     : IDENT | NUMBER | propertyRef
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseExpressionElement(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserTerminal.Type.IDENT: {
                const value = formula.substring(token.getPos(), token.getPos() + token.getLength());
                stack.push(new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.IDENT, value));
                index += 1; // consume IDENT
                break;
            }
            case iotcs.device.impl.FormulaParserTerminal.Type.NUMBER: {
                const value = formula.substring(token.getPos(), token.getPos() + token.getLength());
                stack.push(new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.NUMBER, value));
                index += 1; // consume NUMBER
                break;
            }
            default: {
                index = iotcs.device.impl.FormulaParser._parsePropertyRef(stack, tokens, formula, index);
                break;
            }
        }

        return index;
    }

    // formula
    //    : numericExpression
    //    | ternaryExpression
    //    ;
    //
    // returns the root of the AST
    /**
     * @param {Set<iotcs.device.impl.FormulaParserToken>} tokens
     * @param {string} formula
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    static _parseFormula(tokens, formula) {
        /** @type {Stack<Node>} */
        const stack = new Stack();
        let index = -1;

        try {
            index = iotcs.device.impl.FormulaParser._parseNumericExpression(stack, tokens, formula, 0);
        } catch (error) {
            // drop through = try as conditional expression
        }

        if (index < tokens.size) {
            stack.clear();
            index = iotcs.device.impl.FormulaParser._parseTernaryExpression(stack, tokens, formula, 0);
        }

        let tokensAry = Array.from(tokens);

        if (index < tokens.size) {
            /** @type {iotcs.device.impl.FormulaParserToken} */
            const lastToken = tokensAry[index];
            throw new Error('Formula: parser bailed @ ' + lastToken.pos);
        }

        return stack.get(0);
    }

    //
    // functionElement
    //     : FUNCTION (args)? RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseFunctionElement(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.FUNCTION: {
                const next = iotcs.device.impl.FormulaParser._peekSet(tokens, index + 1);
                // token.getLength()-1 to strip off LPAREN
                const value = formula.substring(token.getPos(), token.getPos() +
                    token.getLength() - 1);

                // FUNCTION operation has function name on LHS, args chaining from RHS to RHS
                const func = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.FUNCTION,
                    new iotcs.device.impl.FormulaParserTerminal(iotcs.device.impl.FormulaParserTerminal.Type.IDENT, value));

                if (next.getType() === iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    // no-arg function
                } else {
                    // FUNCTION arg [, arg]* )
                    index = iotcs.device.impl.FormulaParser._parseArgs(stack, tokens, formula, index + 1);
                    func.setRightHandSide(stack.pop());
                    let current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                    if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                        throw new TypeError("term: Found " + current.getType() + " @ " +
                            current.getPos() + ". Expected RPAREN");
                    }

                    index += 1;
                }

                stack.push(func);
                index += 1; // consume RPAREN
                break;
            }
        }

        return index;
    }


    //
    // multiplicativeExpression
    //     : exponentiationExpression (MUL exponentiationExpression | DIV exponentiationExpression |
    // MOD exponentiationExpression)*
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseMultiplicativeExpression(stack, tokens, formula, index) {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseUnaryExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.MUL:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MUL, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.DIV:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.DIV, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.MOD:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.MOD, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseMultiplicativeExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    //
    // numericExpression
    //     : additiveExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseNumericExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        return iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index);
    }

    //
    // primaryExpression
    //     : brackettedExpression
    //     | functionElement
    //     | expressionElement
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parsePrimaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        let newIndex = iotcs.device.impl.FormulaParser._parseBrakettedExpression(stack, tokens, formula, index);

        if (newIndex === index) {
            newIndex = iotcs.device.impl.FormulaParser._parseFunctionElement(stack, tokens, formula, index);
            if (newIndex === index) {
                newIndex = iotcs.device.impl.FormulaParser._parseExpressionElement(stack, tokens, formula, index);
            }
        }

        if (newIndex === index) {
            throw new TypeError(
                "_parsePrimaryExpression: expected [brackettedExpression|functionElement|expressionElement]"
            );
        }

        return newIndex;
    }

    //
    // propertyRef
    //     : DOLLAR? ATTRIBUTE IDENT RPAREN
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parsePropertyRef(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE:
            case iotcs.device.impl.FormulaParserToken.Type.DOLLAR: {
                let current = token;

                // Handle attribute, which is $? $( IDENT )
                let dollarCount = 0;

                while (current.getType() === iotcs.device.impl.FormulaParserToken.Type.DOLLAR) {
                    dollarCount += 1;

                    if (dollarCount > 1) {
                        throw new TypeError("term: " + current.getType() + " @ " +
                            current.getPos() + " not expected");
                    }

                    index += 1;
                    current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);
                }

                const attrType = iotcs.device.impl.FormulaParserTerminal._getTypeValue(dollarCount);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected ATTRIBUTE");
                }

                index += 1;
                current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected IDENT");}

                const value = formula.substring(current.getPos(), current.getPos() +
                    current.getLength());

                index += 1;
                current = iotcs.device.impl.FormulaParser._peekSet(tokens, index);

                if (current.getType() !== iotcs.device.impl.FormulaParserToken.Type.RPAREN) {
                    throw new TypeError("term: Found " + current.getType() + " @ " +
                        current.getPos() + ". Expected RPAREN");
                }

                stack.push(new iotcs.device.impl.FormulaParserTerminal(attrType, value));
                index += 1; // consume RPAREN
                break;
            }
        }

        return index;
    }


    //
    // relationalExpression
    //     : numericExpression (EQ numericExpression | NEQ numericExpression | LT numericExpression | GT numericExpression | LTE numericExpression | GTE numericExpression )?
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseRelationalExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseNumericExpression(stack, tokens, formula, index);

        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];
        let lhs;

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.EQ:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.EQ, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.NEQ:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.NEQ, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.LT:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.LT, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.LTE:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.LTE, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.GT:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GT, stack.pop());
                index += 1;
                break;
            case iotcs.device.impl.FormulaParserToken.Type.GTE:
                lhs = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.GTE, stack.pop());
                index += 1;
                break;
            default:
                return index;
        }

        index = iotcs.device.impl.FormulaParser._parseRelationalExpression(stack, tokens, formula, index);
        stack.push(iotcs.device.impl.FormulaParser._prioritized(lhs, stack.pop()));

        return index;
    }

    // ternaryExpression
    //     : conditionalOrExpression QUESTION_MARK additiveExpression COLON additiveExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseTernaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        index = iotcs.device.impl.FormulaParser._parseConditionalOrExpression(stack, tokens, formula, index);
        let tokensAry = Array.from(tokens);
        let token = tokensAry[index];

        if (token.getType() !== iotcs.device.impl.FormulaParserToken.Type.QUESTION_MARK) {
            throw new TypeError("_parseTernaryExpression: found " + token +
                ", expected QUESTION_MARK");
        }

        let ternary = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.TERNARY, stack.pop());
        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index + 1);
        tokensAry = Array.from(tokens);
        token = tokensAry[index];

        if (token.getType() !== iotcs.device.impl.FormulaParserToken.Type.COLON) {
            throw new TypeError("_parseTernaryExpression: found " + token + ", expected COLON");
        }

        let alternatives = new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.ALTERNATIVE, stack.pop());
        ternary.setRightHandSide(alternatives);
        index = iotcs.device.impl.FormulaParser._parseAdditiveExpression(stack, tokens, formula, index+1);
        alternatives.setRightHandSide(stack.pop());
        stack.push(ternary);

        return index;
    }

    //
    // unaryExpression
    //     : NOT primaryExpression
    //     | PLUS primaryExpression
    //     | MINUS primaryExpression
    //     | primaryExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseUnaryExpression(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        const tokensAry = Array.from(tokens);
        const token = tokensAry[index];

        switch (token.getType()) {
            case iotcs.device.impl.FormulaParserToken.Type.NOT: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.NOT, stack.pop()));
                break;
            }
            case iotcs.device.impl.FormulaParserToken.Type.PLUS: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.UNARY_PLUS, stack.pop()));
                break;
            }
            case iotcs.device.impl.FormulaParserToken.Type.MINUS: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index + 1);
                stack.push(new iotcs.device.impl.FormulaParserNode(iotcs.device.impl.FormulaParserOperation.Op.UNARY_MINUS, stack.pop()));
                break;
            }
            default: {
                index = iotcs.device.impl.FormulaParser._parsePrimaryExpression(stack, tokens, formula, index);
                break;
            }
        }

        return index;
    }

    //
    // valueLogical
    //     : relationalExpression
    //     ;
    //
    // returns the index of the next token to be processed.
    /**
     *
     * @param stack (Stack<Node>)
     * @param tokens (Set<iotcs.device.impl.FormulaParserToken>)
     * @param formula (string)
     * @param index (int)
     */
    static _parseValueLogical(stack, tokens, formula, index)  {
        if (index >= tokens.size) {
            return tokens.size;
        }

        return iotcs.device.impl.FormulaParser._parseRelationalExpression(stack, tokens, formula, index);
    }

    /**
     *
     * @param tokens Set<iotcs.device.impl.FormulaParserToken>
     * @param offset int
     */
    static _peekSet(tokens, offset) {
        let index = 0 <= offset && offset <= tokens.size - 1 ? offset : tokens.size - 1;
        const tokensAry = Array.from(tokens);
        return tokensAry[index];
    }

    /**
     *
     * @param {string} str
     * @param {number} offset
     * @return {string}
     */
    static _peekString(str, offset) {
        return (offset < str.length) ? str.charAt(offset) : '\0';
    }

    // left hand side needs to have higher precedence than right hand side
    // so that post-fix traversal does higher precedence operations first.
    // The swap on compare == 0 ensures the remaining operations are left-to-right.
    /**
     * @param lhs (Node)
     * @param rhs (Node)
     */
    static _prioritized(lhs, rhs) {
        if (rhs._getOperation() !== iotcs.device.impl.FormulaParserOperation.Op.TERMINAL) {
            let c = iotcs.device.impl.FormulaParser._comparePrecedence(lhs, rhs);

            if (c === 0) {
                lhs.setRightHandSide(rhs.getLeftHandSide());
                const rightHandSide = rhs.getRightHandSide();
                rhs.setLeftHandSide(lhs);
                rhs.setRightHandSide(rightHandSide);
                return rhs;
            } else if (c > 0) {
                const leftHandSide = rhs.getLeftHandSide();
                rhs.setLeftHandSide(lhs);
                lhs.setRightHandSide(leftHandSide);
                return lhs;
            } else {
                lhs.setRightHandSide(rhs);
                return lhs;
            }
        } else {
            lhs.setRightHandSide(rhs);
            return lhs;
        }
    }

    /**
     * Takes a formula as a string and returns the Set of tokens in the formula.
     *
     * @param {string} formula
     * @return {Set<iotcs.device.impl.FormulaParserToken>}
     */
    static _tokenize(formula) {
        const tokens = new Set();
        let pos = 0;
        let tokenType = null;

        for (let i = 0; i < formula.length; ++i) {
            let type = tokenType;
            let length = i - pos;
            const ch = formula.charAt(i);

            switch (ch) {
                case '(':
                    type = iotcs.device.impl.FormulaParserToken.Type.LPAREN;
                    break;
                case ')':
                    type = iotcs.device.impl.FormulaParserToken.Type.RPAREN;
                    break;
                case ',':
                    type = iotcs.device.impl.FormulaParserToken.Type.COMMA;
                    break;
                case '?':
                    type = iotcs.device.impl.FormulaParserToken.Type.QUESTION_MARK;
                    break;
                case ':':
                    type = iotcs.device.impl.FormulaParserToken.Type.COLON;
                    break;
                case '+':
                    type = iotcs.device.impl.FormulaParserToken.Type.PLUS;
                    break;
                case '-':
                    if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                        type = iotcs.device.impl.FormulaParserToken.Type.MINUS;
                    }

                    break;
                case '*':
                    type = iotcs.device.impl.FormulaParserToken.Type.MUL;
                    break;
                case '/':
                    type = iotcs.device.impl.FormulaParserToken.Type.DIV;
                    break;
                case '%':
                    type = iotcs.device.impl.FormulaParserToken.Type.MOD;
                    break;
                case '=': {
                    type = iotcs.device.impl.FormulaParserToken.Type.EQ;
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    // Be forgiving of '=='.
                    if (peekChar === '=') {
                        i += 1;
                    }

                    break;
                }
                case '!': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.NEQ;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.NOT;
                    }

                    break;
                }
                case '>': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.GTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.GT;
                    }

                    break;
                }
                case '<': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '=') {
                        type = iotcs.device.impl.FormulaParserToken.Type.LTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.LT;
                    }

                    break;
                }
                case '|': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '|') {
                        type = iotcs.device.impl.FormulaParserToken.Type.OR;
                        i += 1;
                    }

                    break;
                }
                case '&': {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '&') {
                        type = iotcs.device.impl.FormulaParserToken.Type.AND;
                        i += 1;
                    }

                    break;
                }
                // The $ case needs to be in double quotes otherwise the build will fail.
                case "$": {
                    let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                    if (peekChar === '(') {
                        type = iotcs.device.impl.FormulaParserToken.Type.ATTRIBUTE;
                        i += 1;
                    } else {
                        type = iotcs.device.impl.FormulaParserToken.Type.DOLLAR;
                    }

                    break;
                }
               default:
                    if (ch === ' ') {
                        type = iotcs.device.impl.FormulaParserToken.Type.WS;
                    } else if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                        if (Number.isInteger(parseInt(ch))) {
                            type = iotcs.device.impl.FormulaParserToken.Type.NUMBER;
                        } else if (ch === '.') {
                            // [0-9]+|[0-9]*"."[0-9]+
                            if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.NUMBER) {
                                let peekChar = iotcs.device.impl.FormulaParser._peekString(formula, i + 1);

                                if (Number.isInteger(parseInt(peekChar))) {
                                    type = iotcs.device.impl.FormulaParserToken.Type.NUMBER;
                                    i += 1;
                                } else {
                                    throw new TypeError("Found '" + peekChar + "' @ " + i + 1 +
                                        ": expected [0-9]");
                                }
                            }
                        } else {
                            type = iotcs.device.impl.FormulaParserToken.Type.IDENT;
                        }
                    }

                   break;
            }

            // Add previous token when lexer hits a new token.
            if (tokenType !== type) {
                if (tokenType === iotcs.device.impl.FormulaParserToken.Type.IDENT) {
                    const token = formula.substring(pos, pos+length);

                    if ("AND" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.AND;
                    } else if ("OR" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.OR;
                    } else if ("NOT" === token.toUpperCase()) {
                        tokenType = iotcs.device.impl.FormulaParserToken.Type.NOT;
                    } else if (type === iotcs.device.impl.FormulaParserToken.Type.LPAREN) {
                        tokenType = type = iotcs.device.impl.FormulaParserToken.Type.FUNCTION;
                        continue;
                    }
                }

                // tokenType should only be null the first time through
                if (tokenType) {
                    if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.WS) {
                        tokens.add(new iotcs.device.impl.FormulaParserToken(tokenType, pos, length));
                    }

                    pos += length;
                }

                // Previous token is now current token.
                tokenType = type;
            }
        }

        // Add the last token.
        if (tokenType !== iotcs.device.impl.FormulaParserToken.Type.WS) {
            tokens.add(new iotcs.device.impl.FormulaParserToken(tokenType, pos, formula.length - pos));
        }

        return tokens;
    }

    constructor(height, width) {
        this._height = height;
        this._width = width;
    }
};

iotcs.device.impl.FormulaParserNode = class {
    /**
     *
     * @param {number} operation
     * @param {iotcs.device.impl.FormulaParserNode} leftHandSide
     */
    constructor(operation, leftHandSide) {
        this._operation = operation;
        this._leftHandSide = leftHandSide;
        this._rightHandSide = null;
        this._type = 'node';
        Object.freeze(this._type);
    }

    // Private/protected functions
    /**
     * @param {object} obj
     * @return {boolean} {@code true} if they are equal.
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (obj === null || typeof obj !== typeof this)  {
            return false;
        }

        let lhsEquals = this._leftHandSide === obj.leftHandSide;

        if (this._leftHandSide !== null ? !lhsEquals : obj.leftHandSide !== null)
        {
            return false;
        }

        return this._rightHandSide !== null ? this._rightHandSide === obj.rightHandSide :
            obj.rightHandSide === null;
    }

    /**
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    _getLeftHandSide() {
        return this._leftHandSide;
    }

    /**
     *
     * @return {iotcs.device.impl.FormulaParserOperation}
     */
    _getOperation() {
        return this._operation;
    }

    /**
     *
     * @return {iotcs.device.impl.FormulaParserNode}
     */
    _getRightHandSide() {
        return this._rightHandSide;
    }

    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} leftHandSide
     */
    _setLeftHandSide(leftHandSide) {
        this._leftHandSide = leftHandSide;
    }

    /**
     *
     * @param {iotcs.device.impl.FormulaParserNode} rightHandSide
     */
    _setRightHandSide(rightHandSide) {
        this._rightHandSide = rightHandSide;
    }
};

iotcs.device.impl.FormulaParserOperation = class {
    /**
     *
     * @param {string} operation
     * @return {number} the precedence of this operation.
     */
    static _getPrecedence(operation) {
        switch(operation) {
            case iotcs.device.impl.FormulaParserOperation.Op.GROUP:
            case iotcs.device.impl.FormulaParserOperation.Op.TERMINAL:
                return -1;
            case iotcs.device.impl.FormulaParserOperation.Op.ALTERNATIVE:
            case iotcs.device.impl.FormulaParserOperation.Op.TERNARY:
                return 0;
            case iotcs.device.impl.FormulaParserOperation.Op.AND:
            case iotcs.device.impl.FormulaParserOperation.Op.OR:
                return 1;
            case iotcs.device.impl.FormulaParserOperation.Op.EQ:
            case iotcs.device.impl.FormulaParserOperation.Op.GT:
            case iotcs.device.impl.FormulaParserOperation.Op.GTE:
            case iotcs.device.impl.FormulaParserOperation.Op.LT:
            case iotcs.device.impl.FormulaParserOperation.Op.LTE:
            case iotcs.device.impl.FormulaParserOperation.Op.NEQ:
                return 2;
            case iotcs.device.impl.FormulaParserOperation.Op.MINUS:
            case iotcs.device.impl.FormulaParserOperation.Op.PLUS:
                return 3;
            case iotcs.device.impl.FormulaParserOperation.Op.DIV:
            case iotcs.device.impl.FormulaParserOperation.Op.MOD:
            case iotcs.device.impl.FormulaParserOperation.Op.MUL:
                return 4;
            case iotcs.device.impl.FormulaParserOperation.Op.FUNCTION:
            case iotcs.device.impl.FormulaParserOperation.Op.NOT:
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_MINUS:
            case iotcs.device.impl.FormulaParserOperation.Op.UNARY_PLUS:
                return 6;
        }
    }
};

iotcs.device.impl.FormulaParserOperation.Op = {
    // This is for the alternatives part of ?:, RHS is true choice, LHS is false choice.
    ALTERNATIVE: 'ALTERNATIVE',
    AND: 'AND',
    DIV: 'DIV',
    EQ: 'EQ',
    FUNCTION: 'FUNCTION', // function LHS is function name. args, if any, chain to rhs
    GROUP: 'GROUP', // group LHS is the enclosed arithmetic expression
    GT: 'GT',
    GTE: 'GTE',
    LT: 'LT',
    LTE: 'LTE',
    MINUS: 'MINUS',
    MOD: 'MOD',
    MUL: 'MUL',
    NEQ: 'NEQ',
    NOT: 'NOT', // ! has only LHS, no RHS. LHS is an equality expression or numeric expression
    OR: 'OR',
    PLUS: 'PLUS',
    TERMINAL: 'TERMINAL', // terminal is a number or attribute, LHS is a Terminal, no RHS
    TERNARY: 'TERNARY', // this is for the logical part of ?:, LHS is the logical, RHS is the alternatives
    UNARY_MINUS: 'UNARY_MINUS',
    UNARY_PLUS: 'UNARY_PLUS'
};

iotcs.device.impl.FormulaParserTerminal = class extends iotcs.device.impl.FormulaParserNode {
    /**
     *
     * @param {number} num
     * @return {string} The FormulaParserTerminal.Type, or <code>null</code> if the type is invalid.
     */
    static _getTypeValue(num) {
        switch(num) {
            case 0:
                return iotcs.device.impl.FormulaParserTerminal.Type.IN_PROCESS_ATTRIBUTE;
            case 1:
                return iotcs.device.impl.FormulaParserTerminal.Type.CURRENT_ATTRIBUTE;
            case 2:
                return iotcs.device.impl.FormulaParserTerminal.Type.NUMBER;
            case 3:
                return iotcs.device.impl.FormulaParserTerminal.Type.IDENT;
            default:
                iotcs.error('Invalid FormulaParserTerminal type.');
                return null;
        }
    }

    /**
     *
     * @param {string} type
     * @param {string} value
     */
    constructor(type, value) {
        super(iotcs.device.impl.FormulaParserOperation.Op.TERMINAL, null);
        this._type = type;
        Object.freeze(this._type);
        this._value = value;
    }

    /**
     * @param {object} obj
     * @return {boolean} {@code true} if the objects are equal.
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (!obj || typeof obj !== typeof this) {
            return false;
        }

        if (this._type !== obj.type) {
            return false;
        }

        return !(!this._value ? this._value !== obj.value : obj.value);
    }

    /**
     * @return {string}
     */
    _getValue() {
        return this._value;
    }
};

iotcs.device.impl.FormulaParserTerminal.Type = {
    TYPE: 'TERMINAL',
    IN_PROCESS_ATTRIBUTE: 'IN_PROCESS_ATTRIBUTE',
    CURRENT_ATTRIBUTE: 'CURRENT_ATTRIBUTE',
    NUMBER: 'NUMBER',
    IDENT: 'IDENT',
};

iotcs.device.impl.FormulaParserToken = class {
    /**
     *
     * @param {iotcs.device.impl.FormulaParserToken.Type} type
     * @param {number} pos
     * @param {number} length
     */
    constructor(type, pos, length) {
        this._type = type;
        Object.freeze(this._type);
        this._pos = pos;
        this._length = length;
    }

    /**
     * @return {iotcs.device.impl.FormulaParserToken.Type}
     */
    getType() {
        return this._type;
    }

    /**
     * @return {number}
     */
    getPos() {
        return this._pos;
    }

    /**
     * @return {number}
     */
    getLength() {
        return this._length;
    }

    /**
     * @param {object} obj
     * @return {boolean}
     */
    _equals(obj) {
        if (this === obj) {
            return true;
        }

        if (!obj || typeof obj !== typeof this) {
            return false;
        }

        return this._type === obj.type && this._pos === obj.pos && this._length === obj.length;
    }
};

// Token types
// DJM: Make these "private".
iotcs.device.impl.FormulaParserToken.Type = {
    AND: 'AND',    // &&
    COLON: 'COLON',  // :
    COMMA: 'COMMA',  // ,
    DIV: 'DIV',    // \
    DOLLAR: 'DOLLAR', // $
    EQ: 'EQ',     // =
    FUNCTION: 'FUNCTION', // IDENT '('
    ATTRIBUTE: 'ATTRIBUTE', // '$(' IDENT ')'
    GT: 'GT',     // >
    GTE: 'GTE',    // >=
    IDENT: 'IDENT',  // [_a-zA-Z]+ [_a-zA-Z0-9\-]*
    LPAREN: 'LPARN', // (
    LT: 'LT',     // <
    LTE: 'LTE',    // <=
    MINUS: 'MINUS',  // -
    MOD: 'MOD',    // %
    MUL: 'MUL',    // *
    NEQ: 'NEQ',    // !=
    NOT: 'NOT',    // !
    NUMBER: 'NUMBER', // [0-9]+|[0-9]*"."[0-9]+
    OR: 'OR',     // ||
    PLUS: 'PLUS',   // +
    QUESTION_MARK: 'QUESTION_MARK',
    RPAREN: 'RPAREN', // )
    WS: 'WS'     // whitespace is not significant and is consumed
};
