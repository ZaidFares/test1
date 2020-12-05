const express = require("express");
const router = express.Router();
const fs = require("fs");
//const iotcs = require('device-library.node');
const iotcs = require('iotcs-csl-js');
const oraFunc = require('./oraclefunction');
// const oraFuncCSL = require('./oraclefunctioncsl');
var schedule = require('node-schedule');
const readline = require('readline');
const sqlite3 = require('sqlite3').verbose();
var waituntilfinish=false;
const { exec } = require("child_process");
var http = require("https");

let readme = fs.readFileSync('./AA', 'utf8');
let alldata;



router.post('/postRFID', function(request, response){
    iotcs.oracle.iot.tam.store = "./AA";
    iotcs.oracle.iot.tam.storePassword = "Aa123456";
    //console.log(iotcs.oracle.iot.tam);
    new HelloWorldSample();
    return response.json("sent successfully");
});


router.post('/receiveRFID', function(request, response){

  // const rl = readline.createInterface({
  //   input: fs.createReadStream('./oraclefilesinfo.txt')
  // });
  
  var assets=[];
  var enter=false;
  //if(request.body.hasOwnProperty("tags")){
    
    let db = new sqlite3.Database('./msps.sqlite');
    for(var i=0;i<request.body.tag_reads.length;i++){
     
      assets.push({"epc":request.body.tag_reads[i].epc,"rssi":request.body.tag_reads[i].peakRssi,"antennaport":Number(request.body.tag_reads[i].antennaPort),"Longitude":0,"Latitude":0,"Altitude":0,"RackNo":0,"RFIDReaderAntennaPortId":0,"MessageId":0});
    }
    //  for(var i=0;i<request.body.tags.length;i++){
    //   console.log(request.body.tags.length);
    //   var anntennaport=Number(request.body.tags[i].antennaPort);
    //   var epc=request.body.tags[i].epc;
    //   var rssi=request.body.tags[i].rssi;
      let sqlreader = `SELECT Id,RFIDReaderAntennaPortId,ReaderName,Longitude,Latitude,Altitude,RackNo,AntennaPort FROM ReaderAndPort` ;
      // var readername="",Longitude=0,Latitude=0,Altitude=0,RackNo=0,RFIDReaderAntennaPortId=0,MessageId=0;
      // var continueflag=false;
     db.all(sqlreader, [], (err, rows) => {
       if (err) {
         throw err;
       }
       rows.forEach((row) => {
        
        
        // readers.push(row.ReaderName);
        for(var z=0;z<assets.length;z++){

        
         if(row.ReaderName==request.body.reader_name && assets[z].antennaport==row.AntennaPort){
          enter=true;
           readername=row.ReaderName;
           assets[z].Longitude=row.Longitude;
           assets[z].Latitude=row.Latitude;
           assets[z].Altitude=row.Altitude;
           assets[z].RackNo=row.RackNo;
           assets[z].RFIDReaderAntennaPortId=row.RFIDReaderAntennaPortId;
         }
        }
       //  console.log(row.ReaderName);
       });
     });
     setTimeout(() => {
        if(enter){
         for(var z=0;z<assets.length;z++){
          //console.log(assets[z].MessageId);
      db.run(`INSERT INTO MessageToOracle (RFIDReaderAntennaPortId,EPC,RSSI) VALUES (`+assets[z].RFIDReaderAntennaPortId+`,'`+assets[z].epc+`',`+assets[z].rssi+`)`, function(err) {
         if (err) {
           return console.log(err.message);
         }
         // get the last insert id
         console.log(this.sql.split("'")[1]);
         for(var u=0;u<assets.length;u++){
           if(assets[u].epc==this.sql.split("'")[1]){
            assets[u].MessageId=Number(this.lastID);
           }
         }
        // assets[z].MessageId=Number(this.lastID);
         
       });
       var options = { 
         host: "amtest-asharqnewsservices.oracleiotcloud.com", 
         path: "/cgw/Rfid",
          method: "POST",
           headers: { 
             "Content-Type": "application/json" ,
             "Authorization": "Basic emFpZC5hbGZhcmVzQGFwcHNwcm8tbWUuY29tOkFwcHNwcm9AMTIzNA==" 
           }
          };

   var senddata={
    "Deviceid": assets[z].epc,
    "Type": "CSL",
    "Payload": {
      "Altitude": assets[z].Altitude,
      "Latitude": assets[z].Latitude,
      "Longitude": assets[z].Longitude,
      "RSSI": assets[z].rssi,
      "RackNo": assets[z].RackNo
    }
  };
   
   function makeCall (options, callback) {
      try{
     var req = http.request(options, function (res) 
     { 
      
       res.on("data", function (data)
       { 
        
         callback(data);
        }); 
        res.on("end", function (d) {
         
          
          
           }); 
          });
         

         
          req.write(JSON.stringify(senddata));

             req.end();
         }
         catch (e){
        
         }
        }
    
    makeCall(options, function(results){
     
      
        
    db.run(`Delete from MessageToOracle where Id= `+assets[0].MessageId, function(err) {
    if (err) {
         return console.error(err.message);
     }
      console.log(`Row(s) deleted ${this.changes}`);
 });
assets.splice(0, 1);
      
});
         }
        }
     },2000);
    
     
   //  }
     
   // }
  
  return response.status(200).json({
    data: this.alldata
  });
});

router.post('/CSLRFIDReceive', function(request, response){
  console.log(request.body);
  var assets=[];
  if(request.body.hasOwnProperty("tags")){
    
    let db = new sqlite3.Database('./msps.sqlite');
    for(var i=0;i<request.body.tags.length;i++){
     
      assets.push({"epc":request.body.tags[i].epc,"rssi":request.body.tags[i].rssi,"antennaport":Number(request.body.tags[i].antennaPort),"Longitude":0,"Latitude":0,"Altitude":0,"RackNo":0,"RFIDReaderAntennaPortId":0,"MessageId":0,"RackMounted":0,"NormalSeen":0,"InOrOut":0});
    }
    //  for(var i=0;i<request.body.tags.length;i++){
    //   console.log(request.body.tags.length);
    //   var anntennaport=Number(request.body.tags[i].antennaPort);
    //   var epc=request.body.tags[i].epc;
    //   var rssi=request.body.tags[i].rssi;
      let sqlreader = `SELECT Id,RFIDReaderAntennaPortId,ReaderName,Longitude,Latitude,Altitude,RackNo,AntennaPort,RackMounted FROM ReaderAndPort` ;
      // var readername="",Longitude=0,Latitude=0,Altitude=0,RackNo=0,RFIDReaderAntennaPortId=0,MessageId=0;
      // var continueflag=false;
     db.all(sqlreader, [], (err, rows) => {
       if (err) {
         throw err;
       }
       rows.forEach((row) => {
        
        
        // readers.push(row.ReaderName);
        for(var z=0;z<assets.length;z++){

        
         if(row.ReaderName==request.body.rfidReaderName && assets[z].antennaport==row.AntennaPort){
          
           readername=row.ReaderName;
           assets[z].Longitude=row.Longitude;
           assets[z].Latitude=row.Latitude;
           assets[z].Altitude=row.Altitude;
           assets[z].RackNo=row.RackNo;
           assets[z].RFIDReaderAntennaPortId=row.RFIDReaderAntennaPortId;
           assets[z].RackMounted=row.RackMounted;
           console.error(row.RackMounted);
           if(row.RackMounted==1)
           {
           db.run(`UPDATE MonitoredTags SET InOrOut  = CASE WHEN InOrOut = 1 THEN 0 WHEN InOrOut = 0 THEN 1 ELSE NULL END ,TimeUnix=`+Date.now()+`,RFIDReaderAntennaPortId=`+row.RFIDReaderAntennaPortId+` where TagNo = '`+assets[z].epc+`'`, function(err) {
            if (err) {
              return console.error(err.message);
          }
           console.log(`Row(s) Updated ${this.changes}`);
         
           });
           }else{
            db.run(`UPDATE DoorTags SET InOrOut  = CASE WHEN InOrOut = 1 THEN 0 WHEN InOrOut = 0 THEN 1 ELSE NULL END where RFIDReaderAntennaPortId=`+row.RFIDReaderAntennaPortId+` and TagNo = '`+assets[z].epc+`'`, function(err) {
              if (err) {
                return console.error(err.message);
            }
             console.log(`Row(s) Updated ${this.changes}`);
               if(this.changes==0){
                var tag=this.sql.split("'")[1];
            
                var readerportId=Number(this.sql.split("=")[this.sql.split("=").length-2].split('a')[0]);
            
            db.run(`UPDATE DoorTags SET InOrOut  =  0 , RFIDReaderAntennaPortId=`+readerportId+`  where TagNo = '`+tag+`'`, function(err) {
              if (err) {
                return console.log(err.message);
              }
                  if(this.changes==0){
             var tag=this.sql.split("'")[1];
            
             var readerportId=Number(this.sql.split("=")[this.sql.split("=").length-2].split('w')[0]);
             console.log(`readerportId:`+readerportId);
            db.run(`INSERT INTO DoorTags (TagNo,RFIDReaderAntennaPortId,InOrOut) VALUES ('`+tag+`',`+readerportId+`,0)`, function(err) {
              if (err) {
                return console.log(err.message);
              }
            });
           }
            });
           }
             });
           }
         }
        }
       //  console.log(row.ReaderName);
       });
     });



     setTimeout(() => {
     let sqlreader4 = `SELECT Id,TagNo,TimeUnix,NormalSeen,InOrOut FROM MonitoredTags` ;
     // var readername="",Longitude=0,Latitude=0,Altitude=0,RackNo=0,RFIDReaderAntennaPortId=0,MessageId=0;
     // var continueflag=false;
    db.all(sqlreader4, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
       
       
       // readers.push(row.ReaderName);
       for(var z=0;z<assets.length;z++){

       
        if(row.TagNo==assets[z].epc){
          if(assets[z].RackMounted==1){
         assets[z].NormalSeen=row.NormalSeen;
         assets[z].InOrOut=row.InOrOut;
          }
        }
       }
      //  console.log(row.ReaderName);
      });
    });

    let sqlreader5 = `SELECT Id,TagNo,RFIDReaderAntennaPortId,InOrOut FROM DoorTags` ;
    // var readername="",Longitude=0,Latitude=0,Altitude=0,RackNo=0,RFIDReaderAntennaPortId=0,MessageId=0;
    // var continueflag=false;
   db.all(sqlreader5, [], (err, rows) => {
     if (err) {
       throw err;
     }
     rows.forEach((row) => {
      
      
      // readers.push(row.ReaderName);
      for(var z=0;z<assets.length;z++){

      
       if(row.TagNo==assets[z].epc){
         if(assets[z].RackMounted==0){
    
        assets[z].InOrOut=row.InOrOut;
         }
       }
      }
     //  console.log(row.ReaderName);
     });
   });
  },2000);
    var senddataarray=[];
     setTimeout(() => {
        
         for(var z=0;z<assets.length;z++){
          var senddata;
  
          if(assets[z].RackMounted==0){
           
           
          senddata={
           "Deviceid": assets[z].epc,
           "Type": "CSL",
           "Payload": {
             "Altitude": assets[z].Altitude,
             "Latitude": assets[z].Latitude,
             "Longitude": assets[z].Longitude,
             "RSSI": assets[z].rssi,
             "RackNo": assets[z].RackNo,
             "InOrOut": assets[z].InOrOut
           }
         };
       }
       else{
         
         var inOrout=0;
         if(assets[z].NormalSeen==0){
           inOrout=assets[z].InOrOut;
         }else{
           inOrout=0;
         }
       
         
         senddata={
           "Deviceid": assets[z].epc,
           "Type": "CSL",
           "Payload": {
             "Altitude": assets[z].Altitude,
             "Latitude": assets[z].Latitude,
             "Longitude": assets[z].Longitude,
             "RSSI": assets[z].rssi,
             "RackNo": assets[z].RackNo,
             "InOrOut": inOrout
           }
         };
       }
       senddataarray.push(senddata);
          //console.log(assets[z].MessageId);
      db.run(`INSERT INTO MessageToOracle (RFIDReaderAntennaPortId,EPC,RSSI,TimeUNIX,InOrOut) VALUES (`+assets[z].RFIDReaderAntennaPortId+`,'`+assets[z].epc+`',`+assets[z].rssi+`,`+Date.now()+`',`+assets[z].InOrOut+`)`, function(err) {
         if (err) {
           return console.log(err.message);
         }
         // get the last insert id
         console.log(this.sql.split("'")[1]);
         for(var u=0;u<assets.length;u++){
           if(assets[u].epc==this.sql.split("'")[1]){
            assets[u].MessageId=Number(this.lastID);
           }
         }
        // assets[z].MessageId=Number(this.lastID);
         
       });
       

   
}
   
         
     },4000);
     setTimeout(() => {
      var options = { 
        host: "amtest-asharqnewsservices.oracleiotcloud.com", 
        path: "/cgw/Rfid",
         method: "POST",
          headers: { 
            "Content-Type": "application/json" ,
            "Authorization": "Basic emFpZC5hbGZhcmVzQGFwcHNwcm8tbWUuY29tOkFwcHNwcm9AMTIzNA==" 
          }
         };
      for(var z=0;z<senddataarray.length;z++){
        console.log("InOrOut:"+senddataarray[z].Payload.InOrOut);
        function makeCall (options, callback) {
          try{
         var req = http.request(options, function (res) 
         { 
          
           res.on("data", function (data)
           { 
            
             callback(data);
            }); 
            res.on("end", function (d) {
             
              
              
               }); 
              });
             
    
              
              req.write(JSON.stringify(senddataarray[z]));
    
                 req.end();
             }
             catch (e){
            
             }
            }
        
        makeCall(options, function(results){
         
          
            
        db.run(`Delete from MessageToOracle where Id= `+assets[0].MessageId, function(err) {
        if (err) {
             return console.error(err.message);
         }
          console.log(`Row(s) deleted ${this.changes}`);
     });
    assets.splice(0, 1);
          
    });
      }
     },6000);
     
   //  }
     
    }
//   let db = new sqlite3.Database('./msps.sqlite');
//   if(request.body.hasOwnProperty("tags")){
   

//     // const rl = readline.createInterface({
//     //   input: fs.createReadStream('./oraclefilesinfo.txt')
//     // });
//     let sqlreader = `SELECT ReaderName,ProvisioningFile,Password FROM Readers`;
//  var readername="",provisionfile="",password="";
//  var continueflag=false;
// db.all(sqlreader, [], (err, rows) => {
//   if (err) {
//     throw err;
//   }
//   rows.forEach((row) => {
//    // readers.push(row.ReaderName);
//     if(row.ReaderName==request.body.rfidReaderName){
//       readername=row.ReaderName;
//       provisionfile=row.ProvisioningFile;
//       password=row.Password;
//       continueflag=true;
//     }
//   //  console.log(row.ReaderName);
//   });
//   continueflag=true;
// });
   
// while(!continueflag){
//   require('deasync').sleep(100);
// }
// continueflag=false;
// if(readername!=""){
//   var limit=1000-request.body.tags.length;
//   db.run(`Delete from MessageNotSent where Id Not IN  (Select Id from MessageNotSent order by Id desc limit `+limit+`)`, function(err) {
//     if (err) {
//          return console.error(err.message);
//      }
//       console.log(`Row(s) deleted ${this.changes}`);
//  });
// var forfinished=false;
//   for(var i=0;i<request.body.tags.length;i++){
//   db.run(`INSERT INTO MessageNotSent ( RSSI,AntennaPort,epc,URN,ProvisionPath,Password,ReaderName) VALUES('`+request.body.tags[i].rssi+`','`+request.body.tags[i].antennaPort+`','`+request.body.tags[i].epc+`','`+'urn:com:APPS:CSL:RFIDReader'+`','`+provisionfile+`','`+password+`','`+readername+`')`, function(err) {
//     if (err) {
//       return console.log(err.message);
//     }
//     // get the last insert id
//     console.log(`A row has been inserted with rowid ${this.lastID}`);
//     console.log("i="+i);
//     console.log("tags="+request.body.tags.length);
//     forfinished=true;
   
//     if(i==(request.body.tags.length-1)){
//       continueflag=true;
//       console.log("continueflag="+continueflag);
//     }
//   });
//   while(!forfinished){
//     require('deasync').sleep(100);
//   }
 
//   forfinished=false;
// }
// }

// }
// while(!continueflag){
//   require('deasync').sleep(100);
// }
//  db.close();
// console.log("return");
 return response.sendStatus(200) ;
});
router.post('/elasticRoute', function(request, response){
 console.log(request.body);
  var planId=new Date().getTime();
  var options = { 
    host: "app.elasticroute.com", 
    path: "/api/v1/plan/"+planId+"?c=sync&w=true",
     method: "POST",
      headers: { 
        "Content-Type": "application/json" ,
        "Authorization": "Bearer rrxyxJowYHgv1TmZCVguS9SCJwXSJhFaEOfDKLFnno7uCgFnRGfc7xgmc0uP" 
      }
     };
    //  var optionsdelete = { 
    //   host: "app.elasticroute.com", 
    //   path: "/api/v1/plan/"+planId,
    //    method: "Delete",
    //     headers: { 
    //       "Content-Type": "application/json" ,
    //       "Authorization": "Bearer rrxyxJowYHgv1TmZCVguS9SCJwXSJhFaEOfDKLFnno7uCgFnRGfc7xgmc0uP" 
    //     }
    //    };
     
     function makeCall (options, callback) {
      try{
     var req = http.request(options, function (res) 
     { 
      
       res.on("data", function (data)
       { 
        
         callback(JSON.parse(data));
        }); 
        res.on("end", function (d) {
         
          
          
           }); 
          });
         

         
          req.write(JSON.stringify(request.body));

             req.end();
         }
         catch (e){
        
         }
        }
        // function makeCalldelete (optionsdelete) {
        //   try{
        // var reqdelete = http.request(optionsdelete, function (resdelete) 
        // { 
         
        //   resdelete.on("data", function (data)
        //   { 
            
           
        //    }); 
        //    resdelete.on("end", function (d) {
            
            
        //       }); 
        //      });
             

             
        //      reqdelete.write(JSON.stringify(request.body));
        //      reqdelete.end();
        //      }
        //      catch (e){

        //      }
        //     }
  
makeCall(options, function(results){
 // makeCalldelete(optionsdelete);
  return response.status(response.status(500).send(results));       
});

});
var event = schedule.scheduleJob("*/1 * * * *", function() {
  console.log(Date.now());

var timeunix=Date.now()-60000;
var assets=[];
var seenassets=[];
  let db = new sqlite3.Database('./msps.sqlite');
  let sqlreader = `SELECT Id,RFIDReaderAntennaPortId,Longitude,Latitude,Altitude,RackNo,EPC,RSSI,TimeUnix,InOrOut FROM MessageAndReaderAntenna where TimeUnix < `+timeunix ;
     
      console.log(sqlreader);
     db.all(sqlreader, [], (err, rows) => {
       if (err) {
         throw err;
       }
       rows.forEach((row) => {
        
        assets.push({"epc":row.EPC,"rssi":row.RSSI,"Longitude":row.Longitude,"Latitude":row.Latitude,"Altitude":row.Altitude,"RackNo":row.RackNo,"MessageId":row.Id,"InOrOut":row.InOrOut});
       
       });
     });


     let sqlreader1 = `SELECT RFIDReaderAntennaPortId ,Longitude,Latitude,Altitude,RackNo,TagNo,TimeUnix,NormalSeen,InOrOut FROM MonitoredTagsAndReaderAntenna where RackMounted=1 and ( NormalSeen=0 or TimeUnix < `+timeunix +`)`;
     
     
     db.all(sqlreader1, [], (err, rows) => {
       if (err) {
         throw err;
       }
       rows.forEach((row) => {
        
        seenassets.push({"epc":row.TagNo,"Longitude":row.Longitude,"Latitude":row.Latitude,"Altitude":row.Altitude,"RackNo":row.RackNo,"NormalSeen":row.NormalSeen,"InOrOut":row.InOrOut});
       
       });
     });

     setTimeout(() => {
      for(var z=0;z<seenassets.length;z++){
        var options1 = { 
          host: "amtest-asharqnewsservices.oracleiotcloud.com", 
          path: "/cgw/Rfid",
           method: "POST",
            headers: { 
              "Content-Type": "application/json" ,
              "Authorization": "Basic emFpZC5hbGZhcmVzQGFwcHNwcm8tbWUuY29tOkFwcHNwcm9AMTIzNA==" 
            }
           };
           var inOrout=0;
           
           if(seenassets[z].NormalSeen==0){
            inOrout=seenassets[z].InOrOut;
          }else{
            inOrout=1;
          }
    var senddata1={
     "Deviceid": seenassets[z].epc,
     "Type": "CSL",
     "Payload": {
       "Altitude": seenassets[z].Altitude,
       "Latitude": seenassets[z].Latitude,
       "Longitude": seenassets[z].Longitude,
       
       "RackNo": seenassets[z].RackNo,
       "InOrOut":inOrout
     }
   };
    
    function makeCall (options1, callback) {
       try{
      var req = http.request(options1, function (res) 
      { 
       
        res.on("data", function (data)
        { 
         
          callback(data);
         }); 
         res.on("end", function (d) {
          
           
           
            }); 
           });
          
 
          
           req.write(JSON.stringify(senddata1));
 
              req.end();
          }
          catch (e){
         
          }
         }
     
     makeCall(options1, function(results){
      
       
         
//      db.run(`Delete from MessageToOracle where Id= `+assets[0].MessageId, function(err) {
//      if (err) {
//           return console.error(err.message);
//       }
//        console.log(`Row(s) deleted ${this.changes}`);
//   });
//  assets.splice(0, 1);
       
 });
      }




      for(var z=0;z<assets.length;z++){
        var options = { 
          host: "amtest-asharqnewsservices.oracleiotcloud.com", 
          path: "/cgw/Rfid",
           method: "POST",
            headers: { 
              "Content-Type": "application/json" ,
              "Authorization": "Basic emFpZC5hbGZhcmVzQGFwcHNwcm8tbWUuY29tOkFwcHNwcm9AMTIzNA==" 
            }
           };
 
    var senddata={
     "Deviceid": assets[z].epc,
     "Type": "CSL",
     "Payload": {
       "Altitude": assets[z].Altitude,
       "Latitude": assets[z].Latitude,
       "Longitude": assets[z].Longitude,
       "RSSI": assets[z].rssi,
       "RackNo": assets[z].RackNo,
       "InOrOut":assets[z].InOrOut
     }
   };
    
    function makeCall (options, callback) {
       try{
      var req = http.request(options, function (res) 
      { 
       
        res.on("data", function (data)
        { 
         
          callback(data);
         }); 
         res.on("end", function (d) {
          
           
           
            }); 
           });
          
 
          
           req.write(JSON.stringify(senddata));
 
              req.end();
          }
          catch (e){
         
          }
         }
     
     makeCall(options, function(results){
      
       
         
     db.run(`Delete from MessageToOracle where Id= `+assets[0].MessageId, function(err) {
     if (err) {
          return console.error(err.message);
      }
       console.log(`Row(s) deleted ${this.changes}`);
  });
 assets.splice(0, 1);
       
 });
      }
      } , 10000);
//   var InProgress=true,sendmessages=false;

//   let sqlProgress = `SELECT InProgress FROM SessionInProgress where Id=1`;

//   db.all(sqlProgress, [], (err, rows) => {
//     if (err) {
//       throw err;
//     }
//     rows.forEach((row) => {
//       InProgress=false;
//       sendmessages=row.InProgress;
//      console.log(row.ReaderName);
//     });
//   });
//   while(InProgress){
//     require('deasync').sleep(100);
//    }
//   db.run(`INSERT INTO MessageNotSent ( RSSI,AntennaPort,epc,URN,ProvisionPath,Password) VALUES('`+'44'+`','`+'1'+`','`+'ep345666'+`','`+'urn'+`','`+'./csl'+`','`+'cs12345'+`')`, function(err) {
//     if (err) {
//       return console.log(err.message);
//     }
//     // get the last insert id
//     console.log(`A row has been inserted with rowid ${this.lastID}`);
//   });
//   db.run(`DELETE FROM MessageNotSent WHERE Id IN (1,3) `, function(err) {
//     if (err) {
//       return console.error(err.message);
//     }
//     console.log(`Row(s) deleted ${this.changes}`);
//   });

  
 
// close the database connection

// if(sendmessages)
// {
// console.log("Can Send");
// db.run(`UPDATE SessionInProgress SET InProgress=0`, function(err) {
//     if (err) {
//       return console.log(err.message);
//     }
//     get the last insert id
   
//   });
//   waituntilfinish=true;
  
//   const rl = readline.createInterface({
//     input: fs.createReadStream('./oraclefilesinfo.txt')
//   });
  
//  var readers=[];
//  let sqlreader = `SELECT ReaderName FROM Readers`;
 
// db.all(sqlreader, [], (err, rows) => {
//   if (err) {
//     throw err;
//   }
//   rows.forEach((row) => {
//     readers.push(row.ReaderName);
//    console.log(row.ReaderName);
//   });
// });


//   rl.on('line', function (line) {
//     var line1array=line.split(',');
//     readers.push(line1array[1]);
//   });
//   const r3 = readline.createInterface({
//     input: fs.createReadStream('./Queue.txt')
//   });
//   var tags="";
//   var taglines=[];
//   r3.on('line', function (line){
//     taglines.push(line);
    


  
// });
// let sqlmessage = `SELECT Id,
//   RSSI,
//   AntennaPort,
//   epc,
//   URN,
//   ProvisionPath,
//   Password,
//   ReaderName
// FROM MessageNotSent`;
 
// db.all(sqlmessage, [], (err, rows) => {
//   if (err) {
//     throw err;
//   }
//   rows.forEach((row) => {
//     console.log(row);
//     taglines.push(row.Id+","+row.epc+","+row.RSSI+","+row.AntennaPort+","+row.URN+","+row.ProvisionPath+","+row.Password+","+row.ReaderName);
//   });
// });


// var finihedsending=false;
//   setTimeout(() => {
//     for(var i=0;i<readers.length;i++){
//       var provision='';
//       var password='';
//       var urn='';
//       for (var z=0;z<taglines.length;z++){
//         var linearray=taglines[z].split(',');
//         if(readers[i]==linearray[7]){
//           if(tags!=""){
//             tags+=";";
//           }
//           tags +=linearray[0]+","+linearray[1]+","+linearray[2]+","+linearray[3];
         
//           provision=linearray[5];
//           password=linearray[6];
//           urn=linearray[4];
//         }
        
//       }
//       if(tags!=""){
  
//       finihedsending=false;
//       console.log("node HelloWorldSample.js "+provision+" "+ password +" "+ urn +" "+tags)
//       exec("node HelloWorldSample.js "+provision+" "+ password +" "+ urn +" "+tags, (error, stdout, stderr) => {
//         finihedsending=true;
//         console.log("Sent");
//       });
//        while(!finihedsending){
//         require('deasync').sleep(100);
//        }
     
       
//       }
     
     
//       tags="";
//     }
   
//     db.run(`UPDATE SessionInProgress SET InProgress=1`, function(err) {
//       if (err) {
//         return console.log(err.message);
//       }
//       get the last insert id
     
//     });
//     db.close();
//   }, 3000);
// }else{
//   console.log("In Progress");
//   db.close();
// }

  
  });
  
 
  async function sendmessage(urn,tags,provision,password){
    await new Promise(resolve => setTimeout(resolve(oraFuncCSL.calloracleCSL(urn,tags,provision,password)), 6000));
 }


 class HelloWorldSampleCSL {
  // Receiveddata = {
  //         antennaPort: Number,
  //         epc: String,
  //         firstSeenTimestamp: Date,
  //         isHeartBeat: Boolean,
  //         ora_rssi: Number
  //       }
  constructor(message,urn) {

    this._message = message;
    
    let dcd = new iotcs.device.DirectlyConnectedDevice();

    if (dcd.isActivated()) {
      
      this.getDeviceModel(dcd,urn);
    } else {
     
      dcd.activate([urn], device => {
        dcd = device;

        if (dcd.isActivated()) {
          this.getDeviceModel(dcd,urn);
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
  getDeviceModel(device,urn) {
    console.log("GetDevice");
    let self = this;

    device.getDeviceModel(urn, response => {
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
    console.log(this._message);
    for (var i = 0; i < this._message.length; i++) {
    
      virtualDevice.update({ "epc": this._message[i].epc , "ora_rssi": Number(this._message[i].rssi), "antennaPort": this._message[i].antennaPort });
      
    }

    virtualDevice.close();

    // Give the update some time to process.
    // setTimeout(this.quit, 3000);
    
    setTimeout(() => {
      console.log('Send Hello World! message.');
      waituntilfinish=false;
   }, 3000);

  }
  
}
 
module.exports = router;