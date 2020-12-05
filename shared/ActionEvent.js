/*
 * Copyright (c) 2018, 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * This software is dual-licensed to you under the MIT License (MIT) and
 * the Universal Permissive License (UPL). See the LICENSE file in the root
 * directory for license terms. You may choose either license, or both.
 *
 */

/**
 * An action event.
 *
 * @alias iotcs.ActionEvent
 * @class
 */
iotcs.impl.ActionEvent = class {
    /**
     * Constructs an ActionEvent.
     *
     * @param {VirtualDevice} virtualDevice - The virtual device associated with the action.
     * @param {string} actionName - The name of the action.
     * @param {NamedValue} namedValue - A named value of action arguments.
     */
    constructor(virtualDevice, actionName, namedValue) {
        if (!virtualDevice || !actionName) {
            iotcs.error('Error constructing ActionEvent.  VirtualDevice and actionName cannot be ' +
                        'null.');
        }

        this._virtualDevice = virtualDevice;
        this._actionName = actionName;
        this._namedValue = namedValue;
    }

    // Private/protected functions
    // Public functions
    /**
     * Get the action name.
     *
     * @return {string} The action name, never <code>null</code>.
     */
    getName() {
        return this._actionName;
    }

    /**
     * Get the name-value pair.
     *
     * @return {NamedValue} The name-value pair, never <code>null</code>.
     */
    getNamedValue() {
        return this._namedValue;
    }

    /**
     * Get the virtual device that is the source of the event.
     *
     * @return {VirtualDevice} The virtual device, never <code>null</code>.
     */
    getVirtualDevice() {
        return this._virtualDevice;
    }
};

