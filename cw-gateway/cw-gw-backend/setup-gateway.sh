#!/bin/bash
###
# Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
# This software is dual-licensed to you under the MIT License (MIT) and
# the Universal Permissive License (UPL).  See the LICENSE file in the legal
# directory for license terms.  You may choose either license, or both.
#
###

#Command output log
OUTPUTLOG="./logs/gw-output.log"

CWDEMO_HOME=/home/pi/Projects/metahub-gateway


setup_step1() {
    mkdir -p ./logs
    echo "=== Setup started at $(date) ==="
    echo "=== Setting up gateway with hostname as ${GATEWAY_NAME} ==="
    hostname ${GATEWAY_NAME}
    echo $GATEWAY_NAME > /etc/hostname
    cp /etc/hosts /etc/hosts.bak
    cat /etc/hosts | sed '/127.0.1.1/d'  > /tmp/newhosts
    echo "127.0.1.1 	${GATEWAY_NAME}" >> /tmp/newhosts
    cp /tmp/newhosts /etc/hosts

    echo  "=== Adding WiFi Acces Point  ${WIFI_SSID}"
    cat > /etc/wpa_supplicant/wpa_supplicant.conf << EOF
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=${WIFI_COUNTRYCODE}

network={
    ssid="${WIFI_SSID}"
    psk="${WIFI_PASSKEY}"
    key_mgmt=WPA-PSK
}
EOF
    echo "=== Done ==="
    touch setup-gw.done
    halt
}


#===== Begin =====
if [ -f setup-gateway.properties ]
then
    . setup-gateway.properties
else
    log 'Missing nodecsetup-gateway.properties file'
    exit 1
fi

if [ -f setup-gw.done ]
then
    echo "Setup was successfully done on this Pi." >> $OUTPUTLOG
    exit 0
fi

setup_step1 2>&1 | tee -a $OUTPUTLOG
