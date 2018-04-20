var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var handlebars = require('handlebars');


// var creds = require('credentials.js');
var connection = mysql.createConnection({
  host: "academic-mysql.cc.gatech.edu",
  user: "cs4400_team_27",
  password: "FSuJjLjh",
  database: "cs4400_team_27"
});
connection.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});

var app = express();

/*var logger = function(request, response, next) {
    console.log('Logging...');
    next();
}*/

//Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

//Set Static Path
//app.use(express.static(__dirname + '/pages'));

app.get('/', function(request, response) {
    response.sendFile(__dirname + '/pages/login.html');
});

app.get('/newVisitorRegistration', function(request, response) {
    response.sendFile(__dirname + '/pages/newVisitorRegistration.html');
});

app.get('/newOwnerRegistration', function(request, response) {
    response.sendFile(__dirname + '/pages/newOwnerRegistration.html');
});

app.post('/login', function(request, response) {
    var email = request.body.inputEmail;
    console.log("Login attempt detected from " + email);
    response.sendFile(__dirname + '/pages/login.html');
})

app.listen(3000, function() {
    console.log('Server Started on Port 3000...');
})
