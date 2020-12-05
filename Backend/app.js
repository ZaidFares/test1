const express = require('express');
//const mysql = require('mysql');
const path = require('path');
const userRoutes = require("./routes/user");
const gatewayRoutes = require("./routes/gateway");
const app = express();
var cookieParser = require('cookie-parser');

app.use(cookieParser());


// Set the default views directory to html folder
//app.set('views', path.join(__dirname, 'html'));
// Set the view engine to ejs
app.use("/static", express.static(__dirname + "/static"));
app.set('view engine', 'ejs');
// app.use(express.static(__dirname + "/public"));
// app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css/'));

//DB Connection:


const bodyparser = require('body-parser');


app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.use((req,res,next) => {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Headers",
              "Origin, X-Requested-Width, Content-Type, Accept, Authorization"
);
res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
    next();
});


//user routes
app.use("/api/post", userRoutes);
app.use("/api/gateway", gatewayRoutes);

module.exports = app;
