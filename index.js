var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var handlebars = require('express-handlebars');
var md5 = require('md5');
var userInfo;
var myPropertyInfo;
var allPropertyInfo;
var signedIn = false;


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
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars({defaultLayout: 'login'}));
app.set('view engine', 'handlebars');

//Set Static Path
//app.use(express.static(__dirname + '/pages'));

app.get('/', function(request, response) {
    response.render('login');
    signedIn = false;
    userInfo = null;
});



/*app.get('/newVisitorRegistration', function(request, response) {
    response.render('newVisitorRegistration');
    var username = request.body.inputEmail;
    var email = request.body.inputEmail;
    var password = md5(request.body.inputPassword1);
    var confpassword = md5(request.body.inputPassword2);

    var sql = "SELECT * FROM User WHERE Username = ? OR Email = ?";
    connection.query(sql, [username, email], function(err, result, fields) {
        if (err) {
            return;
        };
        if (results.length > 0) {
            console.log("Username or Email invalid.");
            response.sendFile(__dirname + '/pages/newVisitorRegistration.html');
        } else if (password != confpassword) {
            console.log("Password and confirm password does not match.");
            response.sendFile(__dirname + '/pages/newVisitorRegistration.html');
        } else {
            var insertsql = "INSERT INTO User VALUES (?,?,?,'VISITOR')";
            connection.query(insertsql, [username, email, password], function (err2, results2, fields2) {
                if (err2) {
                    return;
                };
            });
            console.log("New visitor added.");
        };
    });
});*/

app.get('/newOwnerRegistration', function(request, response) {
    response.render('newOwnerRegistration');
});

app.get('/otherProperties', function(request, response) {

    if (signedIn) {
        response.render('otherProperties', {
                username: userInfo.Username,
                personalProperty: myPropertyInfo,
                allProperty: allPropertyInfo
            });
    }
})

app.get('/ownerProperties', function(request, response) {

    if (signedIn) {
        response.render('ownerProperties', {
                username: userInfo.Username,
                personalProperty: myPropertyInfo,
                allProperty: allPropertyInfo
            });
    }

})

app.post('/login', function(request, response) {
    var email = request.body.inputEmail;
    var password = md5(request.body.inputPassword);

    var sql = "SELECT * FROM User WHERE Email = ?";
    connection.query(sql, [email], function(err, result, fields) {
        if (err) {
            return;
        };

        if (result[0] == '') {
            console.log("Invalid Login");
            response.render('badLogin');
        } else {
            if (result[0].Password === password) {
                console.log("Valid Login from " + email);
                userInfo = result[0];
                signedIn = true;


                var sql = "SELECT * FROM Property WHERE Owner = ?";
                connection.query(sql, [userInfo.Username], function(err, result, fields) {
                    myPropertyInfo = result;

                    var sql = "SELECT * FROM Property";
                    connection.query(sql, function(err, result, fields) {
                        allPropertyInfo = result;
                        response.render('ownerProperties', {
                            username: userInfo.Username,
                            personalProperty: myPropertyInfo,
                            allProperty: allPropertyInfo
                        });

                    });
                });
            } else {
                console.log("Invalid Login.");
                response.render('badLogin');
            }
        }

        //console.log(result[0].Username);


    });

    //response.sendFile(__dirname + '/pages/login.html');
});


app.listen(3000, function() {
    console.log('Server Started on Port 3000...');
})
