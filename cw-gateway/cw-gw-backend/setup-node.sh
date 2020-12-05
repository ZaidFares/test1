#!/bin/bash
###
# Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
# This software is dual-licensed to you under the MIT License (MIT) and
# the Universal Permissive License (UPL).  See the LICENSE file in the legal
# directory for license terms.  You may choose either license, or both.
#
###


#Command output log
OUTPUTLOG="./logs/output.log"

CWDEMO_HOME=/home/pi/Projects/metahub-gateway


setup_step1() {
    mkdir -p ./logs
    echo "=== Setup started at $(date) ==="
    echo "=== Setting up node with hostname as ${NODE_NAME} ==="
    hostname ${NODE_NAME}
    echo $NODE_NAME > /etc/hostname
    cp /etc/hosts /etc/hosts.bak
    cat /etc/hosts | sed '/127.0.1.1/d'  > /tmp/newhosts
    echo "127.0.1.1 	${NODE_NAME}" >> /tmp/newhosts
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
    # Create a basic client-config file
    echo "=== Writing node configuration ==="
    cat > ${CWDEMO_HOME}/data/client_config.json <<EOF
{
    "id": "${NODE_NAME}",
    "lat": 0,
    "lon": 0,
    "location": {
        "id": null,
        "name":  null,
        "hazardId": null

    },
    "ledColor": "blue"
}
EOF
    chown pi:pi ${CWDEMO_HOME}/data/client_config.json
    touch setup-node.reboot
    echo "=== Rebooting ==="
    reboot
}


setup_step2() {
    echo "=== Continuing setup after reboot ==="
    IP=$(ifconfig wlan0 | grep "inet ")
    echo "Assigned IP Address - ${IP:-None}"
    DO_PING=1
    GATEWAY_AVAILABLE=false
    TRY_COUNT=1
    while [ $DO_PING -eq 1 ]
    do
        echo "=== ping ${GATEWAY_HOST} ==="
        ping -c 5 ${GATEWAY_HOST}
        if [ $? -eq 0 ]
        then
            DO_PING=0
            GATEWAY_AVAILABLE=true
        else
            TRY_COUNT=$(("$TRY_COUNT + 1"))
            if [ ${TRY_COUNT} -gt 5 ]
            then
                echo "=== Failed to reach ${GATEWAY_HOST}, Giving up after 5 tries ==="
                DO_PING=0
            else
                echo "=== Failed to reach ${GATEWAY_HOST}, Try number ${TRY_COUNT} ==="
            fi
        fi
    done

    if [ ${GATEWAY_AVAILABLE} = true ]
    then
        echo "=== Fetching settings from Gateway ==="
        curl http://${GATEWAY_HOST}:${GATEWAY_PORT}/api/settings > $CWDEMO_HOME/config/settings.json
        if [ $? -gt 0 ]
        then
            echo "=== Failed to get settings from gateway ===" >> ${OUTPUTLOG}
        else
            echo "============== Done ==============" >> ${OUTPUTLOG}
            chown pi:pi $CWDEMO_HOME/config/settings.json
            mv setup-node.reboot setup-node.done
        fi
    fi

    halt
}

#===== Begin =====
if [ -f setup-node.properties ]
then
    . setup-node.properties
else
    log 'Missing nodeconfig.properties file'
    exit 1
fi

if [ -f setup-node.done ]
then
    echo "Setup was successfully done on this Pi." >> $OUTPUTLOG
    exit 0
fi

if [ -f setup-node.reboot ]
then
    setup_step2 2>&1 | tee -a $OUTPUTLOG
else
    setup_step1 2>&1 | tee $OUTPUTLOG
fi
