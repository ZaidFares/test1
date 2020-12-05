/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * The base class for an Action specification, based on a JSON representation of the action
 * specification.
 *
 * @class
 * @ignore
 * @private
 */
iotcs.impl.ActionSpecBase = class {
    /**
     * Constructs an ActionSpecBase class.
     *
     * @param {string} actionSpec - A JSON string which represents the specification of this action.
     */
    constructor(actionSpec) {
        _mandatoryArg(actionSpec, 'object');

        if (!actionSpec.name) {
            iotcs.error('The attribute specification in the device model is incomplete.');
            return;
        }

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {object} spec - The action specification information.
         */
        this._spec = {
            alias: (actionSpec.alias || null),
            args: undefined,   // New arguments.
            argType: undefined,   // Legacy argument.
            description: (actionSpec.description || ''),
            name: actionSpec.name,
            range: undefined   // Legacy range.
        };

        /**
         * The arguments for the action.
         *
         * @type {object[]}
         */
        let args = [];

        // Do we have legacy or new action arguments?
        if (actionSpec.argType) {
            // For legacy action arguments.
            this._spec.range = actionSpec.range ?
                _parseRange(actionSpec.argType, actionSpec.range) : null;
            this._spec.argType = (actionSpec.argType || null);
        } else if (actionSpec.arguments) {
            // For new, multiple action arguments.
            actionSpec.arguments.forEach(actionArgument => {
                args.push(actionArgument);
            });

            this._spec.args = args;
        } else {
            this._spec.args = null;
        }

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {string} name - the name of this action
         */
        this._name = this._spec.name;

        /**
         * @memberof iotcs.impl.ActionSpecBase
         * @member {string} description - the description of this action
         */
        this._description = this._spec.description;
    }

    /**
     * @memberof iotcs.impl.ActionSpecBase
     * @member {function(object)} onAction - The action to perform when the response to an
     *         execute is received from the other party.
     */
    get _onAction() {
        return this.__onAction;
    }

    set _onAction(newFunction) {
        if (newFunction && (typeof newFunction !== 'function')) {
            iotcs.error('Trying to set something to onAction that is not a function!');
            return;
        }

        this.__onAction = newFunction;
    }
};

