# Bluetooth LE reader & gateway for IoT Connected Worker Cloud

A RaspberryPi based demoware to show use of BLE wearable devices with the Oracle IoT Connected Worker Cloud

## Version History
- Release 1.1 (August 27, 2018)
    - Upgraded to use 18.3.x release of Connected Worker Cloud
    - Upgraded MetaWear SDK to 0.2.0
    - Added support for generic bluetooth LE devices, primarily for proximity detection
    - Added support to use the MetaWear sensor in basic proximity detection mode or full mode
    - Added support for motion detection and simulate "man-down" conditions when motion is not detected for configurable elapsed time
    - Added support for displaying battery level in the console for MetaWear sensors in full mode
- Release 1.0 (April 2018)
    - First release with support for MetaWear sensors
  

## Build
### Install dependencies on each Raspberry Pi
- Install bluetooth 
  ```shell
    sudo apt-get -y install bluetooth bluez libbluetooth-dev libudev-dev
  ```
- Install shell-in-a-box
  ```shell
    sudo apt-get -y install shellinabox
  ```
- Edit /etc/default/shellinabox and change the port to 9003
- Install tailon
 ```shell
    sudo apt-get -y install python-pip
    
    sudo pip install tailon
    
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
 ```
### Install NodeJS on each Raspberry Pi
- Install Node Version Manager
  ```
  curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
  ```
- Install NodeJS LTS (start a new terminal or exit and log in again to refresh your environment)
  ```
  nvm install --lts
  ```
### Get the source code
```
git clone https://prasen.palvankar%40oracle.com@alm.oraclecorp.com/iot/s/iot_product-management-demos_6108/scm/metawear-gateway-poc.git
```
### Install application dependencies
```
  npm install
```
 ## Run
 - On the Gateway, run run-server.sh
 - On each of the reader nodes, run run-client.sh
