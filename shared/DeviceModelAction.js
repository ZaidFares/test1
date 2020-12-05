/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates.  All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL).  See the LICENSE file in the root
 * directory for license terms.  You may choose either license, or both.
 */

/**
 * This class represents an action in a device model.
 *
 * @classdesc
 */
iotcs.impl.DeviceModelAction = class {
    /**
     * Constructs a DeviceModelAction.
     *
     * @param {string} name
     * @param {string} description
     * @param {Array<DeviceModelActionArgument>} args
     * @param {string} alias
     *
     * @class
     */
    constructor(name, description, args, alias) {
        /** @type {string} */
        this._alias = alias;
        /** @type {DeviceModelActionArgument[]} */
        this._args = args ? args : [];
        /** @type {string} */
        this._description = description;
        /** @type {string} */
        this._name = name;
    }

    /**
     * Returns the alias of this action, if any.
     *
     * @return {string} The alias of this action, or <code>null</code>.
     */
    _getAlias() {
        return this._alias;
    }

    /**
     * Returns the arguments for this action.
     *
     * return {Array<DeviceModelActionArgument>} The arguments for this action, or
     *        <code>null</code>.
     */
    _getArguments() {
        return this._args;
    }

    /**
     * Returns the description of this action.
     *
     * @return {string} The description of this action, or <code>null</code>.
     */
    _getDescription() {
        return this._description;
    }

    /**
     * Returns the name of this action.
     *
     * @return {string} The name of this action.
     */
    _getName() {
        return this._name;
    }

    /**
     * Returns a string representation of this action.
     *
     * @return {string} A string representation of this action.
     */
    _toString() {
       let first = true;
       let argsAsStr;

       this._args.forEach(argument => {
          if (!first || (first === false)) {
             argsAsStr += ',' + iotcs.impl.Platform.Os._lineSeparator;
          }

          argsAsStr += '\t' + argument.toString();
       });

       return `DeviceModelAction[name=${this._name}, description=${this._description}, ' +
              'alias=${this._alias}, args=[argsAsStr]]`;
    }
};

