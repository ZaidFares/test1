const express = require("express");
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');

let db = new sqlite3.Database('./msps.sqlite');
let sqlreader = `SELECT Id,ReaderName,ProvisioningFile,Password FROM Readers`;

const upload = multer({
  dest: 'uploads/' ,// this saves your file into a directory called "uploads"
  filename:'test.csv'
}); 

// let Readers = [
//     {readerId: 1, ReaderName: 'Reader1', Location: 'HQ'},
//     {readerId: 2, ReaderName: 'Reader2', Location: 'NOC'},
//     {readerId: 3, ReaderName: 'Reader3', Location: 'Room101'},
//     {readerId: 4, ReaderName: 'Reader4', Location: 'Room201'},
//     {readerId: 5, ReaderName: 'Reader5', Location: 'Room203'}
// ]

// router.get('/index/:name', function(request, response){
//     response.render('admin/index', {name: request.params.name});
// });

router.get('/index',async function  (request, response){
    db.all(sqlreader, [], (err, rows) => {
        if (err) {
            throw err;
        }
        response.render('admin/index', {Readers : rows});
        
    });
});

router.post('/index',async function (request, response){
    db.all(sqlreader, [], (err, rows) => {
        if (err) {
            throw err;
        }
        response.render('admin/index', {Readers : rows});
        
    });
});


router.get('/details/:id',async function(request, response){
 
  const id = request.params.id;
  const sql = "select * from Readers where Id = ?";

  db.get(sql, id, (err, row) => {   
    if(row){
         response.render('admin/details', {reader : row});
    }else(
        response.status(404).send('No Reader with this id')
    )  
  });
});

router.get('/antenna/:id',async function(request, response){
 
    const id = request.params.id;
    const sql = "select * from RFIDReaderAntennaPort where ReaderId=" + id;

    db.all(sql, [], (err, rows) => {
        console.log(rows);
      if(rows){
       
           response.render('admin/antenna', {antenna : rows, readerId : id});
      }else{
          response.status(404).send('No Antenna with this id')
      }  
    });
  });
  

router.get('/edit_reader/:id',async function(request, response){
 
    const id = request.params.id;
    const sql = "SELECT * FROM Readers WHERE Id = ?";
    db.get(sql, id, (err, row) => {
  
      if(row){
          response.render('admin/edit_reader', {reader : row});
      }else(
          response.status(404).send('No Reader with this id')
      )
      
    });
  
  });

  router.post('/edit_reader/:id',async function(request, response){
 
    const id = request.params.id;
    const reader = [request.body.ReaderName, request.body.Description, id];
    const sql = "UPDATE Readers SET ReaderName = ?, Description = ? WHERE (Id = ?)";
    db.run(sql, reader, err => {
      if(err){
        response.status(404).send('Update Error')
        console.log(err);
      }else{
        response.redirect('/api/gateway/index');
      }
    
    });

  });

  router.get('/edit_antenna/:id',async function(request, response){
 
    const id = request.params.id;
    const sql = "SELECT * FROM RFIDReaderAntennaPort WHERE Id = ?";
    db.get(sql, id, (err, row) => {
  
      if(row){
          response.render('admin/edit_antenna', {antenna : row, ReaderId: row.ReaderId});
      }else(
          response.status(404).send('No Antenna with this id')
      )
      
    });
  
  });

  router.post('/edit_antenna/:id',async function(request, response){
 
    const id = request.params.id;
    const reader = [request.body.Altitude, request.body.Latitude, request.body.Longitude, request.body.RackNo, request.body.AntennaPort, request.body.RackMounted==null?0:1, id];
    const sql = "UPDATE RFIDReaderAntennaPort SET Altitude = ?, Latitude = ?, Longitude = ?, RackNo = ?, AntennaPort = ?,RackMounted= ? WHERE (Id = ?)";
    db.run(sql, reader, err => {
      if(err){
        response.status(404).send('Update Error')
        console.log(err);
      }else{
        response.redirect('/api/gateway/antenna/'+ request.body.ReaderId);
      }
    
    });

  });

  router.get('/delete_reader/:id',async function(request, response){
 
    const id = request.params.id;
    const sql = "SELECT * FROM Readers WHERE Id = ?";
    db.get(sql, id, (err, row) => {
  
      if(row){
          response.render('admin/delete_reader', {reader : row});
      }else(
          response.status(404).send('No Reader with this id')
      )
      
    });
  
  });


  router.post("/delete_reader/:id", async function(request, response) {
    const id = request.params.id;
    const sql = "DELETE FROM Readers WHERE Id = ?";
    db.run(sql, id, err => {
  
      if(err){
          response.status(404).send('Delete Error')
      }else{
          response.redirect('/api/gateway/index');
      }
      
    });

  });

  router.get('/delete_antenna/:id',async function(request, response){
 
    const id = request.params.id;
    const sql = "SELECT * FROM RFIDReaderAntennaPort WHERE Id = ?";
    db.get(sql, id, (err, row) => {
  
      if(row){
          response.render('admin/delete_antenna', {antenna : row});
      }else(
          response.status(404).send('No antenna with this id')
      )
      
    });
  
  });

  router.post("/delete_antenna/:id", async function(request, response) {
    const id = request.params.id;
    const sql = "DELETE FROM RFIDReaderAntennaPort WHERE Id = ?";
    db.run(sql, id, err => {
  
      if(err){
          response.status(404).send('Delete Error')
      }else{
        response.redirect('/api/gateway/antenna/'+ request.body.ReaderId);
      }
      
    });

  });

router.get('/AddReader',async function (request, response){
    
    response.render('admin/add_Reader');
});

router.post('/AddReader',async function (request, response){
    console.log(request.body);
    const sql = "INSERT INTO Readers (ReaderName, Description) VALUES (?, ?)";
    const reader = [request.body.ReaderName, request.body.Description];
    db.run(sql, reader, err => {
      if (err) {
        return console.error(err.message);
      }
      response.redirect('/api/gateway/index');
    });
  });


router.get('/AddAntenna/:id', async function (request, response) {
    const id = request.params.id;
    response.render('admin/add_antenna', { ReaderId: id });
});

router.post('/AddAntenna',async function (request, response){
    console.log(request.body);
    const sql = "INSERT INTO RFIDReaderAntennaPort (ReaderId, Altitude, Latitude, Longitude, RackNo, AntennaPort,RackMounted) VALUES (?, ?, ?, ?, ?, ?,?)";
    const reader = [request.body.ReaderId, request.body.Altitude, request.body.Latitude, request.body.Longitude, request.body.RackNo, request.body.AntennaPort,request.body.RackMounted==null?0:1 ];
    db.run(sql, reader, err => {
      if (err) {
        return console.error(err.message);
      }
      response.redirect('/api/gateway/antenna/'+ request.body.ReaderId);
    });
  });

router.get('/login',function(request, response){
    response.render('admin/login');
});

router.post('/login', async function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	if (username!=null && password!=null) {
			if (username == "admin" && password == "123456") {
				// request.session.loggedin = true;
				// request.session.username = username;
                // response.redirect('admin/index');
                const readers = await Readers;
                //response.render('admin/index',{Readers : readers});
                response.redirect('/api/gateway/index');
               
			} else {
				response.send('Incorrect Username and/or Password!');
			}			
			response.end();
	} else {
		response.send('Please enter Username and Password!');
		response.end();
	}
});
router.get('/UploadTag',async function (request, response){
    
  response.render('admin/upload_tag');
});
router.post('/UploadTagToDatabase',upload.single('filename'),async function (request, res, next){
 var tags=[];
 var tagnos=[];
  fs.createReadStream(request.file.path)
  .pipe(csv())
  .on('data', (row) => {
    //console.log(row);
    tags.push({"TagNo":row.TagNo,"NormalSeen":row.NormalSeen,"NotExist":1});
    tagnos.push(row.TagNo)
  })
  .on('end', () => {
   
    let sqlreader = `SELECT Id,TagNo,TimeUnix,NormalSeen,RFIDReaderAntennaPortId FROM MonitoredTags` ;
    db.all(sqlreader, [], (err, rows) => {
      if (err) {
        throw err;
      }
      rows.forEach((row) => {
       
        var index = tagnos.indexOf(row.TagNo);
        if(index<0){
          db.run(`Delete from MonitoredTags where Id= `+row.Id, function(err) {
            if (err) {
                 return console.error(err.message);
             }
              console.log(`Row(s) deleted ${this.changes}`);
         });
        }else{
          tags[index].NotExist=0;
          db.run(`UPDATE MonitoredTags SET NormalSeen=`+ Number(tags[index].NormalSeen)+` where Id = `+row.Id, function(err) {
            if (err) {
              return console.error(err.message);
          }
        });
      }
      });
    });
    setTimeout(() => { 
      for(var z=0;z<tags.length;z++){
        if(tags[z].NotExist==1){
          db.run(`INSERT INTO MonitoredTags (TagNo,NormalSeen,InOrOut) VALUES ('`+tags[z].TagNo+`',`+tags[z].NormalSeen+`,0)`, function(err) {
            if (err) {
              return console.log(err.message);
            }

          });
        }
      }
      res.redirect('UploadTag?Saved=1');
      },5000);
  });

});
module.exports = router;