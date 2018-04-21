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

/*app.get('/newOwnerRegistration', function(request, response) {
    response.render('newOwnerRegistration');
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

app.get('/otherProperties', function(request, response) {
    console.log(signedIn);

    if (signedIn) {
        response.render('otherProperties', {
            username: userInfo.Username,
            personalProperty: myPropertyInfo,
            allProperty: allPropertyInfo
        });
    }
});

app.post('/viewPropertyDetails', function(request, response) {
    //console.log("Running");
    //console.log(request.body);
    var idSelection = request.body.idSelection;
    var sql = "SELECT * FROM Property WHERE ID = ?";
    connection.query(sql, [idSelection], function(err, result, fields) {
        if (err) {
            return;
        }

        if (result == '') {

        } else {

            var resultPropInfo = result;
            var sql = "SELECT * FROM User WHERE Username = ?";
            console.log(resultPropInfo[0].Owner);
            connection.query(sql, [resultPropInfo[0].Owner], function(err, result, fields) {
                //console.log(result);
                response.render('propertyDetails', {
                    propertyInfo: resultPropInfo[0],
                    personalInfo: result[0]
                });
                //console.log(resultPropInfo);

            })

        }
    })

});


app.get('/ownerProperties', function(request, response) {

    if (signedIn) {
        response.render('ownerProperties', {
            username: userInfo.Username,
            personalProperty: myPropertyInfo,
            allProperty: allPropertyInfo
        });
    }

})

// initial visitor page
app.get('/visitorHome', function(request, response) {
    if (signedIn) {
        var sql = `SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
                    TYPE , (

                    CASE WHEN IsPublic =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Public, (

                    CASE WHEN IsCommercial =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
                    FROM Property
                    JOIN Visit ON Visit.PropertyID = Property.ID
                    WHERE Property.IsPublic = 0
                    AND Property.ApprovedBy IS NOT NULL
                    GROUP BY Property.ID`;

        connection.query(sql, function(err, result, fields) {
            console.log(result);
            console.log(userInfo.Username);
            response.render('visitorHome', {
                username: userInfo.Username,
                rows: result
            });
        });
    }

})

// searching / filtering on visitor table
app.post('/visitorHome', function(request, response) {
    var col = request.body.column;
    var search = request.body.search;
    response.render('visitorHome');
    // if (signedIn) {
    //     var sql =  `

    //     SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
    //     TYPE , (

    //     CASE WHEN IsPublic =1
    //     THEN 'True'
    //     ELSE 'False'
    //     END
    //     ) AS Public, (

    //     CASE WHEN IsCommercial =1
    //     THEN 'True'
    //     ELSE 'False'
    //     END
    //     ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
    //     FROM Property
    //     JOIN Visit ON Visit.PropertyID = Property.ID
    //     WHERE Property.IsPublic = 1
    //     AND Property.ApprovedBy IS NOT NULL
    //     AND $searchby = $search
    //     GROUP BY Property.ID`;

    //     connection.query(sql, [col, search], function(err, result, fields) {
    //         // console.log(result);
    //         // console.log(userInfo.Username);
    //         response.render('visitorHome', {
    //             username: userInfo.Username,
    //             rows: result
    //         });
    //     });

    // }
});

// visitor property details
app.post('/visitorDetails', function(request, response) {
    console.log(request.body);
    var id = request.body.idSelection;
    var username = request.body.username;
    var logged = request.body.logged;
    var rating = request.body.rating;

    // console.log(id);
    // console.log(username);
    // console.log(logged);
    // console.log(rating);
    var sqlInit = `
    SELECT P . * , FarmItem.Name, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
    FROM (

    SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, Size AS 'Size (acres)', AVG( Rating ) , PropertyType AS
    TYPE , (

    CASE WHEN IsPublic =1
    THEN 'True'
    ELSE 'False'
    END
    ) AS Public, (

    CASE WHEN IsCommercial =1
    THEN 'True'
    ELSE 'False'
    END
    ) AS Commercial, Property.ID AS ID
    FROM Property
    JOIN User ON Property.Owner = User.Username
    JOIN Has ON Property.ID = Has.PropertyID
    JOIN FarmItem ON FarmItem.Name = Has.ItemName
    JOIN Visit ON Visit.PropertyID = Property.ID
    WHERE Property.ID =$id
    ) AS P
    JOIN Has ON Has.PropertyID = P.ID
    JOIN FarmItem ON FarmItem.Name = Has.ItemName`;

    var sqlLog = 'INSERT INTO Visit VALUES ($username, $propertyid, CURRENT_TIMESTAMP, $rating);';
    var sqlUnlog = 'DELETE FROM Visit WHERE Username = $username AND PropertyID = $id';

    if (request.body.logged === false) {
        connection.query(sqlLog, [username, id, rating], function(err, result, fields) {
            console.log(result);
            response.render('visitorDetails', {
                // propertyInfo: resultPropInfo[0],
                // personalInfo: result[0]
            });
            //console.log(resultPropInfo);

        });
    } else if (request.body.logged === true) {
        connection.query(sqlUnlog, [username, id], function(err, result, fields) {
            console.log(result);
            response.render('visitorDetails', {
                // propertyInfo: resultPropInfo[0],
                // personalInfo: result[0]
            });
            //console.log(resultPropInfo);
        });
    } else {
        connection.query(sqlInit, [id], function(err, result, fields) {
            console.log(result);
            response.render('visitorDetails', {
                // propertyInfo: resultPropInfo[0],
                // personalInfo: result[0]
            });
            //console.log(resultPropInfo);
        });
    }


    // var sql = "SELECT * FROM Property WHERE ID = ?";
    // connection.query(sql, [idSelection], function(err, result, fields) {
    //     if (err) {
    //         return;
    //     } else if (result == '') {
    //         console.log("Invalid Property");
    //     } else {
    //         var resultPropInfo = result;
    //         var sql = "SELECT * FROM User WHERE Username = ?";
    //         console.log(resultPropInfo[0].Visitor);
    //         connection.query(sql, [resultPropInfo[0].Owner], function(err, result, fields) {
    //             //console.log(result);
    //             response.render('visitorDetails', {
    //                 propertyInfo: resultPropInfo[0],
    //                 personalInfo: result[0]
    //             });
    //             //console.log(resultPropInfo);

    //         })
    //     }
    // })
});

// visitor history
app.get('/visitorHistory', function(request, response) {

    var username = request.body.username;
    if (signedIn) {
        var sql = `
        SELECT Property.Name, Visit.VisitDate, Visit.Rating, Property.ID
        FROM Visit JOIN Property ON Property.ID = Visit.Property
        WHERE Visit.Username = $username`;

        connection.query(sql, [username], function(err, result, fields) {
            console.log(result);
            response.render('visitorDetails', {
                name: result[0],
                visitDate: result[1],
                rating: result[2],
                id: result[3]
            });

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

                if (userInfo.UserType === 'OWNER') {
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
                } else if (userInfo.UserType === 'VISITOR') { // change WHERE Property.IsPublic to 1 for actual results
                    var sql = `SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
                                TYPE , (

                                CASE WHEN IsPublic =1
                                THEN 'True'
                                ELSE 'False'
                                END
                                ) AS Public, (

                                CASE WHEN IsCommercial =1
                                THEN 'True'
                                ELSE 'False'
                                END
                                ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
                                FROM Property
                                JOIN Visit ON Visit.PropertyID = Property.ID
                                WHERE Property.IsPublic = 0
                                AND Property.ApprovedBy IS NOT NULL
                                GROUP BY Property.ID`;

                    connection.query(sql, function(err, result, fields) {
                        // console.log(result);
                        // console.log(userInfo.Username);
                        response.render('visitorHome', {
                            username: userInfo.Username,
                            rows: result
                        });
                    });
                }

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
