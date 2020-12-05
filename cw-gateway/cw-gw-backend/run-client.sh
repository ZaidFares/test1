#!/bin/bash
###
# Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
# This software is dual-licensed to you under the MIT License (MIT) and
# the Universal Permissive License (UPL).  See the LICENSE file in the legal
# directory for license terms.  You may choose either license, or both.
#
###

echo "module.exports = '`pwd`/node_modules/metawear/MetaWear-SDK-Cpp/dist/release/lib/arm/libmetawear.so.0.16.0';" > node_modules/metawear/MetaWear-SDK-Cpp/bindings/javascript/libmetawear-path.js

# If called from rc.local, NVM environment is not setup
if [ "$NVM_DIR" = "" ]
then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
fi

cd $(dirname $0)
# Loop while client exits with 10
RUN=1
while [ ${RUN} -eq 1 ]
do
    node client.js
    EXITCODE=$?
    case $EXITCODE in
        20) sudo reboot;;
        30) sudo halt;;
        *)  echo "======== Restarting Client ========"
    esac
done



