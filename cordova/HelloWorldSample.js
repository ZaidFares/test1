/*
 * This sample changes a message attribute on a virtual device and triggers a message to the Cloud
 * Service with the updated attribute value.
 *
 * The client is a directly connected device using the Virtual Device API.
 */

class HelloWorldSample {
    constructor() {
        let dcd = new iotcs.device.DirectlyConnectedDevice('<provisioning_file.upf',
            '<provisioning_file_password');

        this.virtualDevice = null;

        if (dcd.isActivated()) {
            this.getDeviceModel(dcd);
        } else {
            dcd.activate(['urn:test:helloworld'], device => {
                dcd = device;

                if (dcd.isActivated()) {
                    this.getDeviceModel(dcd);
                }
            });
        }
    }

    /**
     * Retrieves the hello world device model from the IoT CS.
     *
     * @param {iotcs.device.VirtualDevice} device the VirtualDevice.
     */
    getDeviceModel(device) {
        let self = this;

        device.getDeviceModel('urn:test:helloworld', response => {
            self.startVirtualDevice(device, device.getEndpointId(), response);
        });
    }

    /**
     * Quits this application.
     */
    quit() {
        if (this.virtualDevice) {
            this.virtualDevice.close();
        }
    }

    /**
     * Starts the VirtualDevice and sends a message.
     *
     * @param {iotcs.device.VirtualDevice} the VirtualDevice.
     * @param {string} id the device Endpoint ID.
     * @param {Object} deviceModel the device's device model.
     */
    startVirtualDevice(device, id, deviceModel) {
        this.virtualDevice = device.createVirtualDevice(id, deviceModel);
        self = this;

        let sendMessage = function() {
            console.log('Sending "Hello World!" message.');
            self.virtualDevice.update({"message": "Hello World!"});
            // Give the update some time to process.
            //setTimeout(this.quit, 3000);
        };

        setInterval(sendMessage, 5000);
    }
}

console.log('HelloWorldSample running...');
new HelloWorldSample();
