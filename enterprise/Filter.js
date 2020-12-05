/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * Creates a Filter builder object.  This class allows to easily formulate filter queries and
 * convert straight to Json Queries. 
 *
 * @example
 * let f = new iotcs.enterprise.Filter();
 *
 * f = f.and([
 *     f.eq("name","Andrew"),
 *     f.or([f.not(f.in("maritalStatus", ["MARRIED", "SINGLE"])),
 *           f.gte("children.count", 1)]),
 *     f.gt("salary.rank", 3),
 *     f.lte("salary.rank", 7),
 *     f.like("lastName", "G%")
 * ]);
 *
 * iotcs.log(f.stringify());
 * // '{"$and":[{"name":{"$eq":"Andrew"}},{"$or":[{"$not":{"maritalStatus":{"$in":["MARRIED","SINGLE"]}}},{"children.count":{"$gte":1}}]},{"salary.rank":{"$gt":3}},{"salary.rank":{"$lte":7}},{"lastName":{"$like":"G%"}}]}';
 *
 * @alias iotcs.enterprise.Filter
 * @class iotcs.enterprise.Filter
 * @memberOf iotcs.enterprise
 */
iotcs.enterprise.Filter = class {
    // Static private/protected functions
    /** @ignore */
    static _argIsFilter(arg) {
        return (arg instanceof iotcs.enterprise.Filter);
    }

    /** @ignore */
    static _is(parameter, types) {
        let ptype = typeof parameter;

        for(let index = 0; index < types.length; index++) {
            if (types[index] === ptype) {
                return true;
            }
        }

        iotcs.log('Type is "' + ptype + '" but should be [' + types.toString() + '].');
        iotcs.error('Invalid parameter type for "'+parameter+'".');
        return false;
    }

    constructor(query) {
        this._query = query || {};
    }

    // Private/protected functions
    /**
     * @param args {(object[]|...object)}
     * @ignore
     */
    _argsAreFilters(args) {
        if (Array.isArray(args)) {
            // args are []. 
            return args.every(arg => {
                return (arg instanceof iotcs.enterprise.Filter);
            });
        } else {
            // args are varargs.
            for (let i = 0; i < args.length; i++) {
                if (! (args[i] instanceof iotcs.enterprise.Filter)) {
                    return false;
                }
            }

            return true;
        }
    }

    // Public functions
    /**
     * And operator.
     * <p>
     * Checks if all conditions are true.
     * <p>
     * This function takes either an array of iotcs.enterprise.Filter
     * or an indefinit number of iotcs.enterprise.Filter.
     *
     * @param {(iotcs.enterprise.Filter[]|...iotcs.enterprise.Filter)} args - an array
     * or variable length argument list of filters to AND
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function and
     */
    and(args) {
        let filters = null;

        if (Array.isArray(args)) {
            if (!this._argsAreFilters(args)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = args;
        } else {
            if (!this._argsAreFilters(arguments)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = [];

            for (let i = 0; i < arguments.length; i++) {
                filters.push(arguments[i]);
            }
        }

        let query = {"$and":filters};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Equality operator
     * <p>
     * Note that if the value string does contain a <code>%</code>,
     * then this operation is replaced by the
     * {@link iotcs.enterprise.Filter#like like} operation.
     *
     * @param {string} field - the field name
     * @param {(string|number)} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function eq
     */
    eq(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['string', 'number']))
        {
            let query = {};

            if ((typeof value === 'string') && (value.indexOf('%') >= 0)) {
                iotcs.log('$eq value field contains a "%".  Operation replaced into a $like.');
                query[field] = {"$like":value};
            } else {
                query[field] = {"$eq":value};
            }

            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Exists operator.
     * <p>
     * Checks whether the field's value matches the given boolean state.
     *
     * @param {string} field - the field name
     * @param {boolean} state - the boolean to test field against
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function exists
     */
    exists(field, state) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(state, ['boolean']))
        {
            let query = {};
            query[field] = {"$exists":state};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Greater-than operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function gt
     */
    gt(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$gt":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Greater-than-or-equal operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function gte
     */
    gte(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$gte":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Is-in operator.
     * <p>
     * Checks whether the field's value is one of the proposed values.
     *
     * @param {string} field - the field name
     * @param {(string[]|number[])} valuearray - an array of same typed
     * values to test the field against. Values can only be simple
     * types such as numbers or string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function in
     */
    in(field, valuearray) {
        if (iotcs.enterprise.Filter._is(field, ['string']) && Array.isArray(valuearray)) {
            let type = null;

            for (let index in valuearray) {
                let value = valuearray[index];
                if (!type && iotcs.enterprise.Filter._is(value, ['string', 'number'])) {
                    type = typeof value;
                } else if (typeof value !== type) {
                    iotcs.error('Inconsistent value types in $in valuearray.');
                    return null;
                }
            }

            let query = {};
            query[field] = {"$in":valuearray};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Like operator.
     * <p>
     * Checks whether the field's value matches the search query. Use
     * <code>%</code> in the match string as search jocker, e.g.
     * <code>"jo%"</code>.
     * <p>
     * Note that if the match string does not contain any <code>%</code>,
     * then this operation is replaced by the
     * {@link iotcs.enterprise.Filter#eq eq} operation.
     *
     * @param {string} field - the field name
     * @param {string} match - the pattern matching string to test field against
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function like
     */
    like(field, match) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(match, ['string']))
        {
            let query = {};

            if (match.indexOf('%') < 0) {
                iotcs.log('$eq match field does not contains any "%".  Operation replaced into a $eq.');
                query[field] = {"$eq":match};
            } else {
                query[field] = {"$like":match};
            }

            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Less-than operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function lt
     */
    lt(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$lt":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Less-than-or-equal operator
     *
     * @param {string} field - the field name
     * @param {number} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function lte
     */
    lte(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['number']))
        {
            let query = {};
            query[field] = {"$lte":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Not-equal operator
     *
     * @param {string} field - the field name
     * @param {(string|number)} value - the value to compare the field
     * against. Values can only be simple types such as numbers or
     * string.
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function ne
     */
    ne(field, value) {
        if (iotcs.enterprise.Filter._is(field, ['string']) &&
            iotcs.enterprise.Filter._is(value, ['string', 'number']))
        {
            let query = {};
            query[field] = {"$ne":value};
            return new iotcs.enterprise.Filter(query);
        }

        return null;
    }

    /**
     * Not operator
     * <p>
     * Checks if the negative condition is true.
     *
     * @param {iotcs.enterprise.Filter} filter - a filter to negate
     * @memberof iotcs.enterprise.Filter
     * @function not
     */
    not(filter) {
        if (!iotcs.enterprise.Filter._argsIsFilter(filter)) {
            iotcs.error('Invalid type.');
            return;
        }

        let query = {"$not":filter};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Or operator.
     * <p>
     * Checks if at least one of the conditions is true.
     * <p>
     * This function takes either an array of iotcs.enterprise.Filter
     * or an indefinit number of iotcs.enterprise.Filter.
     *
     * @param {(iotcs.enterprise.Filter[]|...iotcs.enterprise.Filter)} args - an array
     * or variable length argument list of filters to OR
     * @returns {iotcs.enterprise.Filter} a new Filter expressing this operation
     * @memberof iotcs.enterprise.Filter
     * @function or
     */
    or(args) {
        let filters = null;

        if (Array.isArray(args)) {
            if (!this._argsAreFilters(args)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = args;
        } else {
            if (!this._argsAreFilters(arguments)) {
                iotcs.error('Invalid operation type(s).');
                return;
            }

            filters = [];

            for (let i = 0; i < arguments.length; i++) {
                filters.push(arguments[i]);
            }
        }

        let query = {"$or":filters};
        return new iotcs.enterprise.Filter(query);
    }

    /**
     * Converts this filter into a JSON object
     *
     * @function toJSON
     * @memberof iotcs.enterprise.Filter
     */
    toJSON() {
        return this._query;
    }

    /**
     * Returns a string containing a string-ified version of the current filter.
     *
     * @function toString
     * @memberof iotcs.enterprise.Filter
     */
    toString() {
        return JSON.stringify(this._query);
    }

};

/**
 * Alias for toString.
 *
 * @function stringify
 * @memberof iotcs.enterprise.Filter
 */
iotcs.enterprise.Filter.stringify = iotcs.enterprise.Filter.toString;

