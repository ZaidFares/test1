/*
 * Copyright (c) 2015, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and 
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An Action specification, based on a JSON representation of the action specification.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.enterprise.impl.ActionSpec = class extends iotcs.impl.ActionSpecBase {
    /**
     * Constructs an ActionSpec.
     *
     * @param {string} actionSpec - A JSON string which represents the specification of this action.
     */
    constructor(actionSpec) {
        super(actionSpec);
        this._onAction = arg => {};
    }

    // Public functions
    /**
     * Verifies that the argument, based on the Action specification in the device model, is an
     * argument for the Action.
     *
     * @param {*} arg The argument to check.
     * @returns {*} The original argument if it passes validation, the URI if it's an ExternalObject,
     *          or <code>null</code>.
     *
     * @ignore
     * @private
     */
    checkAndGetVarArg(arg) {
        if (!this._spec.argType) {
            if (typeof arg !== 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return null;
            }
        } else {
            if (typeof arg === 'undefined') {
                iotcs.error('Invalid number of arguments.');
                return null;
            }

            if (this._spec.argType === 'URI') {
                if (arg instanceof iotcs.ExternalObject) {
                    arg = arg.getURI();
                } else if (typeof arg === 'string') {
                    // nothing to do
                } else {
                    iotcs.error('Invalid URI parameter.');
                    return null;
                }
            }

            if (!iotcs.enterprise.impl.Attribute._matchType(this._spec.argType, arg)) {
                iotcs.error('Type mismatch; action "' + this._spec.name + '" requires arg type [' +
                    this._spec.argType + '].');
                return null;
            }

            if (this._spec.range &&
                ((arg < this._spec.range.low) || (arg > this._spec.range.high)))
            {
                iotcs.error('Trying to use an argument which is out of range [' +
                    this._spec.range.low + ' - ' + this._spec.range.high + '].');
                return null;
            }
        }
        return arg;
    }

    /**
     * Verifies that the arguments, based on the Action specification in the device model, are
     * arguments for the Action.
     *
     * @param {Map<string, string>} [args] - A <code>Map</code> of action argument names to action
     *        argument values to pass for action execution.  The arguments are specific to the
     *        action.  The description of the arguments is provided in the device model.
     * @return {object} The original arguments, as an object (suitable to JSON.stringify), if they
     *          pass validation or <@code>null</code>.  If an ExternalObject is supplied, it's URI
     *          is stored in the returned args.
     *
     * @ignore
     * @private
     */
    checkAndGetVarArgs(args) {
        if (this._spec.args.length === Object.keys(args).length) {
            // New action arguments
            let newArgs = null;
            let self = this;

            for (const argName in args) {
                let argValue = args[argName];

                if (typeof argValue === 'undefined') {
                    iotcs.error('Invalid number of arguments.');
                    return null;
                }

                let argSpec;

                for (let aSpec of self._spec.args) {
                    if (aSpec.name === argName) {
                        argSpec = aSpec;
                        break;
                    }
                }

                if (argSpec.type === 'URI') {
                    if (argValue instanceof iotcs.ExternalObject) {
                        argValue = argValue.getURI();
                    } else if (typeof argValue === 'string') {
                        // nothing to do
                    } else {
                        iotcs.error('Invalid URI parameter.');
                        return null;
                    }
                }

                let isMatch = iotcs.enterprise.impl.Attribute._matchType(argSpec.type, argValue);

                // DATETIME may be Date/Time or # milliseconds since the epoch.
                if (!isMatch && (argSpec.type === 'DATETIME')) {
                    isMatch = iotcs.enterprise.impl.Attribute._matchType('NUMBER', argValue);
                }

                if (!isMatch) {
                    iotcs.error('Type mismatch for action "' + self._spec.name +
                        '" requires arg type [' + argSpec.type + '].');

                    return null;
                }

                if (argSpec.range &&
                    ((argValue < argSpec.range.low) || (argValue > argSpec.range.high)))
                {
                    iotcs.error('Trying to use an argument which is out of range [' +
                        argSpec.range.low + ' - ' + argSpec.range.high + '].');

                    return null;
                }

                newArgs = newArgs ? newArgs : {};
                newArgs[argName] = argValue;
            }

            return newArgs;
        } else {
            iotcs.error('Invalid number of arguments.');
            return null;
        }
    }
};
