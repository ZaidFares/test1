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


# Get config from /boot
getConfig() {
    if [ -f $INSTALLDIR/cwinstall-properties.sh ]
    then
        . $INSTALLDIR/cwinstall-properties.sh
        log "Setting up this RPi as ${SETUP_TYPE}"
        return 0
    else
        log "Install params not found"
        return 1
    fi
}

log() {
    l="CWINSTALL: [$(date '+%Y/%m/%d %H:%M:%S')]  $*"
    logger $l
    echo $l | tee -a ${INSTALLDIR}/cw_install.log

}


# Update host, wifi & reboot
setupNetworking() {
    #if [ "$SETUP_TYPE" = "GATEWAY" ]
    #then
    #    hostName=${GATEWAY_HOST}
    #else
    #    hostName=${NODE_NAME}
    #fi
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
    #touch /boot/cw_install_status.reboot
    #log "Rebooting ..."
    #reboot
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
    curl -o /tmp/install.sh https://raw.githubusercontent.com/creationix/nvm/v0.33.9/install.sh
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
nvm install --lts
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

# Install shellinabox
installShellInABox() {
    log "Installing shellinabox"
    aptitude -y install shellinabox
    if [ $? -gt 0 ]
    then
        log "Failed to install shellinabox"
        return 1
    fi
    cp /etc/default/shellinabox /tmp/shellinabox
    cat /tmp/shellinabox | sed 's/_PORT=4200/_PORT=9003/' > /etc/default/shellinabox
    log "shellinabox install successful."

    return 0
}

# Install tailon
installtailon() {
    log "Installing tailon"
    aptitude -y install python-pip
    pip install tailon
    if [ $? -gt 0 ]
    then
        log "Failed to install tailon"
        return 1
    fi

    log "Creating tailon configuration"
    cat > /home/pi/tailon.yaml <<EOF
bind: 0.0.0.0:9004      # address and port to bind on
allow-transfers: true   # allow log file downloads
follow-names: true     # allow tailing of not-yet-existent files
commands: [tail, grep]  # allowed commands
tail-lines: 100          # number of lines to tail initially
wrap-lines: true        # initial line-wrapping state
sort-order: name        # directory listing order (default: 'name')

files:
  - '/home/pi/Projects/metahub-gateway/logs'
EOF
    log "tailon installation successful."
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
    cat > ${CWDEMO_HOME}/config/logger.json <<EOF
{
  "appenders": {
    "fileLog": {
      "type": "file",
      "filename": "logs/server.log",
      "maxLogSize": 1024000,
      "backups": 2
    },
    "clientFileLog": {
      "type": "file",
      "filename": "logs/client.log",
      "maxLogSize": 1024000,
      "backups": 2
    },
    "consoleLog": {
      "type": "stdout"
    },
    "socketLog": {
      "type": "socketLogger",
      "socketProvider": "socketio-server"
    }
  },
  "categories": {
    "default": {
      "appenders": ["fileLog", "consoleLog"],
      "level": "debug"
    },
    "client": {
      "appenders": ["consoleLog", "clientFileLog"],
      "level": "debug"
    },
    "MetawearDevice": {
      "appenders": ["consoleLog", "clientFileLog"],
      "level": "debug"
    },
    "BleScanner": {
      "appenders": ["consoleLog", "clientFileLog"],
      "level": "debug"
    },
    "RequestHandler": {
      "appenders": ["consoleLog", "clientFileLog"],
      "level": "info"
    }

  }
}
EOF
}

# Setup gateway / node
setupGateway() {
    log "Setting up CW gateway"
    mkdir -p ${CWDEMO_HOME}/config
    mkdir -p ${CWDEMO_HOME}/logs
    mkdir -p ${CWDEMO_HOME}/data
    #cd ${CWDEMO_HOME}/..
    #log "Extracting Gateway server"
    #unzip -qo $INSTALLDIR/cw_gateway.zip
    #if [ $? -gt 0 ]
    #then
    #    log "Failed to extract gateway server from ZIP"
    #    return 1
    #fi
    chown -R pi:pi /home/pi/*
    #echo '{}' > ${CWDEMO_HOME}/data/device-user-list.json
    log "Generating settings"
    generateGWSettings
    log "Installing dependencies"
    #chmod -R u+wr ${CWDEMO_HOME}/node_modules
    # aptitude -y install git
    # if [ $? -gt 0 ]
    # then
	# log "Failed to install git (needed by npm)"
	# return 1
    # fi
    chown -R pi:pi ${CWDEMO_HOME}
    log "Gateway installation successful."
    return 0
}

setupNode() {
    log "Setting up CW gateway client"
    mkdir -p ${CWDEMO_HOME}/config
    mkdir -p ${CWDEMO_HOME}/logs
    mkdir -p ${CWDEMO_HOME}/data
    cd ${CWDEMO_HOME}/..
    unzip -qo $INSTALLDIR/cw_node.zip
    if [ $? -gt 0 ]
    then
        log "Failed to extract node client from ZIP"
        return 1
    fi
    generateGWSettings
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
    chown -R pi:pi /home/pi/*

    return 0
}

# Update rc.local
updateStartup() {
    log "Updating rc.local to start CW gateway/client on startup"
    if [ "$SETUP_TYPE" = "GATEWAY" ]
    then
        runScript="run-server.sh"
    else
        runScript="run-client.sh"
    fi
    grep "^#CWDEMO" /etc/rc.local > /dev/null 2>&1
    if [ $? -gt 0 ]
    then
        cp /etc/rc.local /tmp/rc.local.bak
        cat /etc/rc.local | sed '/ssh/d' | sed '/^exit/d' | sed '/cw_install/d' > /tmp/rc.local.new
        cat >> /tmp/rc.local.new <<EOF
#CWDEMO
if [ -f /home/pi/Projects/metahub-gateway/config/settings.json ]
then
	/usr/local/bin/tailon -c /home/pi/tailon.yaml &
	su -l pi -c /home/pi/Projects/metahub-gateway/${runScript} &
fi

exit 0
EOF
        cp /tmp/rc.local.new /etc/rc.local
    fi
    log "Gateway setup done"
    return 0
}


setupNode() {
    log "Setting up CW gateway client"
    mkdir -p ${CWDEMO_HOME}/config
    mkdir -p ${CWDEMO_HOME}/logs
    mkdir -p ${CWDEMO_HOME}/data
    cd ${CWDEMO_HOME}/..
    unzip -qo $INSTALLDIR/cw_node.zip
    if [ $? -gt 0 ]
    then
        log "Failed to extract node client from ZIP"
        return 1
    fi
    generateGWSettings
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
    chown -R pi:pi /home/pi/*

    return 0
}

# Update rc.local
updateStartup() {
    log "Updating rc.local to start CW gateway/client on startup"
    if [ "$SETUP_TYPE" = "GATEWAY" ]
    then
        runScript="run-server.sh"
    else
        runScript="run-client.sh"
    fi
    grep "^#CWDEMO" /etc/rc.local > /dev/null 2>&1
    if [ $? -gt 0 ]
    then
        cp /etc/rc.local /tmp/rc.local.bak
        sed '/ssh/d' /etc/rc.local | sed '/^exit/d' /etc/rc.local | sed '/cw_install/d' > /tmp/rc.local.new
        cat >> /tmp/rc.local.new <<EOF
#CWDEMO
if [ -f /home/pi/Projects/metahub-gateway/config/settings.json ]
then
	/usr/local/bin/tailon -c /home/pi/tailon.yaml &
	su -l pi -c /home/pi/Projects/metahub-gateway/${runScript} &
fi

exit 0
EOF
        cp /tmp/rc.local.new /etc/rc.local
    fi
    log "Gateway setup done"
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

echo 'Install ShellInABox and Talion ? [Y/N]'
read INSTALL_SIB_T
case "$INSTALL_SIB_T" in
    Y)
        installShellInABox
        installtailon
        ;;
    N)  
        echo 'Skipping ShellInABox and Talion installation.'
        ;;
    *)
        echo "$INSTALL_SIB_T is not a valid choice, only 'Y' or 'N' must be provided. Skipping ShellInABox and Talion installation."
        exit 1
        ;;
esac
    

if [ -f /boot/cw_install_status.done ]
then
    log "Installion was completed successfuly"
    exit 0
fi

#getConfig || exit 1

if [ -f /boot/cw_install_status.reboot ]
then
    log "Resuming installing after reboot"
    (if [ "$SETUP_TYPE" = "GATEWAY" ]
    then
        setupGateway
    else
        setupNode
    fi)
    if [ $? -eq 0 ]
    then
        updateStartup
        mv /boot/cw_install_status.reboot /boot/cw_install_status.done
        log "Installation complete. Rebooting..."
        reboot
    else
        cp /home/pi/cwinstall/cw_install.log /boot
        log "Install failed"
    fi
fi
