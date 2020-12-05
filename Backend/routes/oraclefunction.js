//const iotcs = require('device-library.node');


function calloracle(message,provisioningfile,password) {    

  iotcs.oracle.iot.tam.store = provisioningfile;
  iotcs.oracle.iot.tam.storePassword = password;
  
  new HelloWorldSample(message);
}

class HelloWorldSample {
  // Receiveddata = {
  //         antennaPort: Number,
  //         epc: String,
  //         firstSeenTimestamp: Date,
  //         isHeartBeat: Boolean,
  //         ora_rssi: Number
  //       }
  constructor(message) {

    this._message = message;
    
    let dcd = new iotcs.device.DirectlyConnectedDevice();

    if (dcd.isActivated()) {
      this.getDeviceModel(dcd);
    } else {
      dcd.activate(['urn:com:CSG:Impinj:RFIDReader'], device => {
        dcd = device;

        if (dcd.isActivated()) {
          this.getDeviceModel(dcd);
        }
      });
    }
  }

  get message() {
    return this._message;
  }

  set message(newmessage) {
    this._message = newmessage; // validation could be checked here such as only allowing non numerical values
  }

  /**
   * Retrieves the hello world device model from the IoT CS.
   *
   * @param {iotcs.device.VirtualDevice} device the VirtualDevice.
   */
  getDeviceModel(device) {
    let self = this;

    device.getDeviceModel('urn:com:CSG:Impinj:RFIDReader', response => {
      self.startVirtualDevice(device, device.getEndpointId(), response);
    });
  }

  /**
   * Quits this application.
   */

  // quit() {
  //   process.exit(0);
  // }

  /**
   * Starts the VirtualDevice and sends a message.
   *
   * @param {iotcs.device.VirtualDevice} the VirtualDevice.
   * @param {string} id the device Endpoint ID.
   * @param {Object} deviceModel the device's device model.
   */
  startVirtualDevice(device, id, deviceModel) {
    let virtualDevice = device.createVirtualDevice(id, deviceModel);
    //   virtualDevice.update({"epc": "E280681000000039EB4E5B20"});
    // virtualDevice.update({"epc": this._message.epc});
    // virtualDevice.update({"ora_rssi": this._message.peakRssi});
    // virtualDevice.update({"antennaPort": this._message.antennaPort});

    for (var i = 0; i < this._message.length; i++) {
      virtualDevice.update({ "epc": this._message[i].epc, "ora_rssi": this._message[i].peakRssi, "antennaPort": this._message[i].antennaPort });
      console.log(this._message[i])
    }

    virtualDevice.close();

    // Give the update some time to process.
    // setTimeout(this.quit, 3000);
    
    setTimeout(() => {
      console.log('Send Hello World! message.');
    }, 3000);

  }
  
}


module.exports.calloracle = calloracle;