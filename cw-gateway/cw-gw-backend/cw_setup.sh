#!/bin/bash
###
# Copyright (c) 2019, Oracle and/or its affiliates.  All rights reserved.
# This software is dual-licensed to you under the MIT License (MIT) and
# the Universal Permissive License (UPL).  See the LICENSE file in the legal
# directory for license terms.  You may choose either license, or both.
#
###

INSTALLDIR=`pwd`
CWDEMO_HOME=$INSTALLDIR
exec 2>> ${INSTALLDIR}/cw_install.log

log() {
    l="CWINSTALL: [$(date '+%Y/%m/%d %H:%M:%S')]  $*"
    logger $l
    echo $l | tee -a ${INSTALLDIR}/cw_install.log

}

# Update host, wifi & reboot
setupNetworking() {
    log "Setting hostname as ${hostName} "
    hostname ${hostName}
    echo ${hostName} > /etc/hostname
    cp /etc/hosts /etc/hosts.bak
    cat /etc/hosts | sed '/127.0.1.1/d'  > /tmp/newhosts
    echo "127.0.1.1 	${hostName}" >> /tmp/newhosts
    cp /tmp/newhosts /etc/hosts

    log "Adding WiFi Acces Point  ${WIFI_SSID}"
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
}

# Check network connectivity
checkInternetAccess() {
    log "Checking internet access"
    ipaddress=$(hostname -I)
    if [ "${ipaddress}" = "" ]
    then
	log "Waiting for IP address to be assigned..."
	declare -i count
	count=0
	while [ "${ipaddress}" = "" ]
	do
	    if [ $count -gt 3 ]
	    then
		    log "Failed to get IP address. Aborting installtion."
		    return 1
	    else
		    log "Retrying after 10 seconds..."
	    fi

	    sleep 10s
	    ipaddress=$(hostname -I)
	    count+=1
	done
    fi
    log "IP Addresses ${ipaddress}"

    curl -so /dev/null http://oracle.com
    if [ $? -gt 0 ]
    then
        log "No access to the Internet."
        return 1
    else
        log "Internet access check OK."
        return 0
    fi
}

# Install nodejs
installNodejs() {
    log "Downloading nvm"
    curl -O https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh
    if [ $? -gt 0 ]
    then
        log "Failed to download nvm"
        return 1
    fi
    log "Installing nvm"
    chmod a+x /tmp/install.sh
    (export HOME=/home/pi; su -p -l pi -c /tmp/install.sh)

    if [ $? -gt 0 ]
    then
        log "Failed to install nvm"
        return 1
    fi

    log "Installing nodjs latest LTS version"
    cat > /tmp/installnode.sh <<EOF
. /home/pi/.nvm/nvm.sh
nvm install 8.11.3
EOF
    chmod a+xr /tmp/installnode.sh
    (export HOME=/home/pi; su -p -l pi -c /tmp/installnode.sh)
    if [ $? -gt 0 ]
    then
        log "Failed to install nodejs"
        return 1
    fi

    return 0
}

# Install bluetooth dependencies and setup bluetooth access
installBluetoothLibs() {
    log "Installing bluetooth libs"
    apt-get -y update 1>&2
    apt-get -y install bluetooth bluez libbluetooth-dev libudev-dev 1>&2
    if [ $? -gt 0 ]
    then
        log "Failed to install bluetooth dependencies"
        return 1
    fi

    log "Bluetooth libs installed"
     cat > /tmp/whichnode.sh <<EOF
. /home/pi/.nvm/nvm.sh
which node
EOF
    chmod a+x /tmp/whichnode.sh
    whichNode=$(/tmp/whichnode.sh)
    log "Enabling non-root access to bluetooth for nodejs processes..."
    setcap cap_net_raw+eip $(eval readlink -f $whichNode)

    return 0
}

generateGWSettings() {
    cat > ${CWDEMO_HOME}/config/settings.json <<EOF
{
    "server": {
        "host": "${GATEWAY_HOST}.local",
        "listenPort": ${GATEWAY_PORT}
    },
     "client": {
        "rssiSampleSize": 10,
        "outOfRangeTimeoutMsecs": 10000,
        "txPower": -68,
        "watchLoopInterval": 5000,
        "maxOutOfRangeMessages": 3,
        "rssiUpdateInterval": 1000,
        "maxRange": 5,
        "bleDeviceTypes": {
            "metawear": {
                "mode": "full",
                "serviceId": "326a900085cb9195d9dd464cfbbae75a",
                "temperatureUpdateFreq": 60,
                "batteryUpdateFreq": 600,
                "motionDetectionFreq": 30,
                "motionSampleSize": 4,
                "motionThreshold": 0.25,
                "fallDownSampleSize": 4,
                "fallDownThreshold": 0.5,
                "fallDownHeight": 2
            },
            "generic": {
                "name": "Generic",
                "mode": "off",
                "serviceId": ""
            },
            "ibeacon": {
                "name": "Estimote",
                "mode": "off",
                "serviceId": ""
            }
        }
    },
    "iotcs": {
        "debug": true,
        "provisioningFile": "cw-gw-1.csv",
        "provisioningPassword": "Welcome1",
        "username": "iot",
        "password": "welcome1",
        "cwProjectId": 0,
        "cwManDownWhen": {
            "noMotionMinutes": 2,
            "alertFrequency": 10
        }
    }
}
EOF
    cp ${INSTALLDIR}/default_logger.json ${CWDEMO_HOME}/config/logger.json
}

# Setup gateway / node
setupGateway() {
    log "Setting up CW gateway"
    mkdir -p ${CWDEMO_HOME}/config
    mkdir -p ${CWDEMO_HOME}/logs
    mkdir -p ${CWDEMO_HOME}/data
    chown -R pi:pi ${CWDEMO_HOME}/../*
    log "Generating settings"
    generateGWSettings
    chown -R pi:pi ${CWDEMO_HOME}/../*
    chmod -R a+w ${CWDEMO_HOME}/config

    log "Gateway installation successful."
    return 0
}

setupNode() {
    log "Setting up CW gateway client"
    mkdir -p ${CWDEMO_HOME}/config
    mkdir -p ${CWDEMO_HOME}/logs
    mkdir -p ${CWDEMO_HOME}/data
    if [ $? -gt 0 ]
    then
        log "Failed to extract node client from ZIP"
        return 1
    fi
    generateGWSettings
    cat > ${CWDEMO_HOME}/data/client_config.json <<EOF
{
    "id": "${NODE_NAME}",
    "lat": ${NODE_LATITUDE},
    "lon": ${NODE_LONGITUDE},
    "location": {
        "id": null,
        "name":  null,
        "hazardId": null
    },
    "ledColor": "blue"
}
EOF
    chown -R pi:pi ${CWDEMO_HOME}/../*
    return 0
}


## Main
echo 'Would you like to setup networking ? [Y/N]'
read SET_NETWORK
echo 'answer' $SET_NETWORK

case "$SET_NETWORK" in
    Y)
        echo 'Set host name'
        read hostName
        echo 'Set WiFi Access Point SSID'
        read WIFI_SSID
        echo 'Set WiFi Pass Key'
        read -s WIFI_PASSKEY
        echo 'Set WiFi Country Code'
        read WIFI_COUNTRYCODE
        setupNetworking
        echo Checking Internet Access
        checkInternetAccess
        ;;
    N)
        echo 'Not setting network.'
        ;;
    *)
        echo "$SET_NETWORK is not a valid choice, only 'Y' or 'N' must be provided."
        exit 1
        ;;
esac

echo 'Install NodeJS ? [Y/N]'
read INSTALL_NODEJS
case "$INSTALL_NODEJS" in
    Y)
        installNodejs
        ;;
    N)
        echo "Skipping NodeJS installation."
        ;;
    *)
        echo "$INSTALL_NODEJS is not a valid choice, only 'Y' or 'N' must be provided. Skipping NodeJS installation."
        exit 1
        ;;
esac

echo 'Install Bluetooth libraries ? [Y/N]'
read INSTALL_BLE
case "$INSTALL_BLE" in
    Y)
        installBluetoothLibs
        ;;
    N)
        echo 'Skipping Bluetooth libraries installation.'
        ;;
    *)
        echo "$INSTALL_BLE is not a valid choice, only 'Y' or 'N' must be provided. Skipping Bluetooth libraries installation."
        exit 1
        ;;
esac

echo "Setup Gateway ? [Y/N]"
read SETUP_GW
case "$SETUP_GW" in
    Y)
        echo "Gateway hostname:"
        read GATEWAY_HOST

        echo "Gateway port:"
        read GATEWAY_PORT

        setupGateway
        ;;
    N)  
        echo 'Skipping Gateway Setup.'
        echo "Setup Node ? [Y/N]"
        read SETUP_NODE
        case "$SETUP_NODE" in
            Y)
                echo "Gateway hostname (required for node setup):"
                read GATEWAY_HOST

                echo "Gateway port (required for node setup):"
                read GATEWAY_PORT

                echo "Node hostname:"
                read NODE_NAME

                echo "Node latitude:"
                read NODE_LATITUDE

                echo "Node longitude:"
                read NODE_LONGITUDE
                
                setupNode
                ;;
            N)  
                echo 'Skipping Node Setup.'
                ;;
            *)
                echo "$SETUP_NODE is not a valid choice, only 'Y' or 'N' must be provided. Skipping Node Setup."
                ;;
        esac
        ;;
    *)
        echo "$SETUP_GW is not a valid choice, only 'Y' or 'N' must be provided. Skipping Gateway Setup."
        ;;
esac
