var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var handlebars = require('express-handlebars');
var md5 = require('md5');


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
app.set('pages', path.join(__dirname, 'pages'));
app.engine('handlebars', handlebars({defaultLayout: 'login'}));
app.set('view engine', 'handlebars')

//Set Static Path
//app.use(express.static(__dirname + '/pages'));

app.get('/', function(request, response) {
    response.render(__dirname + '/pages/login.handlebars');
});

app.get('/newVisitorRegistration', function(request, response) {
    response.sendFile(__dirname + '/pages/newVisitorRegistration.html');
});

app.get('/newOwnerRegistration', function(request, response) {
    response.sendFile(__dirname + '/pages/newOwnerRegistration.html');
});

app.post('/login', function(request, response) {
    var email = request.body.inputEmail;
    var password = md5(request.body.inputPassword);

    var sql = "SELECT * FROM User WHERE Email = ?";
    connection.query(sql, [email], function(err, result, fields) {
        if (err) {
            return;
        };

        //console.log(result)

        if (result == '') {
            console.log("Invalid Login");
            response.sendFile(__dirname + '/pages/badLogin.html');
        } else {
            if (result[0].Password === password && result[0].UserType === "OWNER") {
                console.log("Valid Login from " + email);
                response.render(__dirname + '/pages/ownerProperties.handlebars', {
                    username: result[0].Username
                });
            } else {
                console.log("Invalid Login.");
                response.sendFile(__dirname + '/pages/badLogin.html');
            }
        }

        //console.log(result[0].Username);


    });
    //response.sendFile(__dirname + '/pages/login.html');
})

app.listen(3000, function() {
    console.log('Server Started on Port 3000...');
})
