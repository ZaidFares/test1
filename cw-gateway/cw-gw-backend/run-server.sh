#!/bin/bash
###
# Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
# This software is dual-licensed to you under the MIT License (MIT) and
# the Universal Permissive License (UPL).  See the LICENSE file in the legal
# directory for license terms.  You may choose either license, or both.
#
###



# If called from rc.local, NVM environment is not setup
echo "module.exports = '`pwd`/node_modules/metawear/MetaWear-SDK-Cpp/dist/release/lib/arm/libmetawear.so.0.16.0';" > node_modules/metawear/MetaWear-SDK-Cpp/bindings/libmetawear-path.js

if [ "$NVM_DIR" = "" ] 
then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
fi

cd $(dirname $0)

# Loop while server exits with 0
EXITCODE=0
while [ ${EXITCODE} -eq 0 ]
do
    node server.js
    EXITCODE=$?
    if [ ${EXITCODE} -eq 0  ]
    then
        echo "======== Restarting Server ========"
    fi
done

case $EXITCODE in
    20) sudo reboot;;
    30) sudo halt;;
    *) echo "Done.";;
esac

