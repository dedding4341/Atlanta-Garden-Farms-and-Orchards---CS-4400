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
var animalList;
var cropList;


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

//add new property
app.get('/addProperty', function(request, response) {
    // console.log('begin');

    var Animalsql= `SELECT *
          FROM FarmItem
          WHERE Type = 'ANIMAL'`;
    connection.query(Animalsql,function(err, result, fields) {
        animalList = result;
        // console.log(animalList[0].Name);
        var CropSql = `SELECT *
                      FROM FarmItem
                      WHERE Type != 'ANIMAL'`;
        connection.query(CropSql,function(err, result, fields) {
            cropList  = result;
            response.render('addProperty', {
              animals : animalList,
              crops : cropList
            });
        });
        // console.log(animalList);
        // console.log(cropList);
    });

    // if (signedIn) {
    //     console.log(animalList);
    //     response.render('addProperty', {
    //       animals : animalList,
    //       crops : cropList
    //     });
    // }

});

app.post('/addProperty', function(request, response) {
    var name = request.body.idSelection;
    var size = request.body.size;
    size = parseFloat(size);
    var isCommercial = request.body.isCommercial;
    var isPublic = request.body.isPublic;
    var street = request.body.address;
    var city = request.body.city;
    var zip = request.body.zip;
    zip = parseInt(zip);
    var type = request.body.type;
    var crop = request.body.crops;
    var animal = request.body.animals;
    var owner = userInfo.Username;


    var sql = `SELECT MAX(ID) AS Id FROM Property`;
      connection.query(sql, function(err, result, fields) {
          console.log('result: '+result);
          var Id = result[0].Id;

          console.log(Id);
          Id = Id + 1;
          if (isPublic == 'Yes') {
            isPublic = 1;
          } else {
            isPublic = 0;
          }
          if (isCommercial == 'Yes') {
            isCommercial = 1;
          } else {
            isCommercial = 0;
          }
          isCommercial = parseInt(isCommercial);
          isPublic - parseInt(isPublic);
          var sql2 = `INSERT INTO Property VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL);`;
          connection.query(sql2,[Id, name, size, isCommercial, isPublic, street, city, zip, type, owner] ,function(err, result, fields) {
              // console.log("second query");
              var sql3 = `INSERT INTO Has Values (?, ?);`;
              connection.query(sql3, [Id, crop], function(err, result, fields) {
                    if (type == 'FARM') {
                        var sql4 =  `INSERT INTO Has Values (?, ?);`;
                        connection.query(sql4, [Id, animal], function(err,result, fields) {
                            response.render('ownerProperties', {
                            username: userInfo.Username,
                            personalProperty: myPropertyInfo,
                            allProperty: allPropertyInfo
                          });
                        });
                    } else {
                        response.render('ownerProperties', {
                        username: userInfo.Username,
                        personalProperty: myPropertyInfo,
                        allProperty: allPropertyInfo
                      });
                    }
              });
          });


        });

});

//manage selected property screen
app.get('/manageProperty', function(request, response) {

    if (signedIn) {
        response.render('manageProperty');
    }

})

app.get('/allOwnersInSystem', function(request, response) {

    if (signedIn) {
        response.render('allOwnersInSystem');
    }

})

app.get('/allVisitorsInSystem', function(request, response) {

    if (signedIn) {
        var sql = `SELECT User.Username, User.Email, COUNT(VisitDate) as LoggedVisits
        FROM User LEFT JOIN Visit ON Visit.Username = User.Username
        WHERE User.UserType = 'VISITOR'
        GROUP BY Username`;
        connection.query(sql, function(err, result, fields) {
            response.render('allVisitorsInSystem', {
                username: userInfo.Username,
                rows: result
            });
        });
    }
})

app.get('/viewConfirmedProperties', function(request, response) {

    if (signedIn) {
        response.render('viewConfirmedProperties');
    }

})

app.get('/adminLandingPage', function(request, response) {
    if (signedIn) {
        response.render('adminLandingPage');
    }

})

app.post('/adminLandingPage', function(request, response) {
    var user = request.body.column;
    console.log(user);
    response.render('adminLandingPage');
});

app.get('/viewUnconfirmedProperties', function(request, response) {

    if (signedIn) {
        response.render('viewUnconfirmedProperties');
    }

})

app.get('/approvedAnimalsCrops', function(request, response) {

    if (signedIn) {
        response.render('approvedAnimalsCrops');
    }

})

app.get('/pendingApprovalAnimalsCrops', function(request, response) {

    if (signedIn) {
        response.render('pendingApprovalAnimalsCrops');
    }

})

// initial visitor page
app.get('/visitorHome', function(request, response) {
    if (signedIn) {
        var sql = 
            `SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
            WHERE Property.IsPublic = 1
            AND Property.ApprovedBy IS NOT NULL
            GROUP BY Property.ID`;

        connection.query(sql, function(err, result, fields) {
            console.log(result);
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
    var min = request.body.min;
    var max = request.body.max;
    console.log(request.body);

    if (col == 'Address') {
        col = 'Street';
    } else if (col == 'Type') {
        col = PropertyType;
    } else if (col == 'Public') {
        col = 'IsPublic';
    } else if (col == 'Commercial') {
        col = 'IsCommercial';
    }

    if (signedIn) {
        if (col == 'Visits') {
            var sqlVisit;
            if (search == '') {
                sqlVisit = `
                    SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
                    ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
                    FROM Property
                    JOIN Visit ON Visit.PropertyID = Property.ID
                    WHERE Property.IsPublic = 1
                    AND Property.ApprovedBy IS NOT NULL
                    GROUP BY Property.ID
                    HAVING COUNT(*) BETWEEN ? AND ?`;
            } else {
                sqlVisit = 
                    `SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
                    ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
                    FROM Property
                    JOIN Visit ON Visit.PropertyID = Property.ID
                    WHERE Property.IsPublic = 1
                    AND Property.ApprovedBy IS NOT NULL
                    GROUP BY Property.ID
                    HAVING COUNT(*) = $search`;

            }
            connection.query(sqlVisits, [min, max], function(err, result, fields) {
                console.log(result);
                response.render('visitorHome', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        } else if (col == 'Avg. Rating') {
            var sqlAvgRating;
            if (search == '') {
                sqlAvgRating = `
                    SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
                    ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
                    FROM Property
                    JOIN Visit ON Visit.PropertyID = Property.ID
                    WHERE Property.IsPublic = 1
                    AND Property.ApprovedBy IS NOT NULL
                    GROUP BY Property.ID
                    HAVING AVG(Rating) BETWEEN ? AND ?`;    // change isPublic to 1 later

                connection.query(sqlAvgRating, [min, max], function(err, result, fields) {
                    console.log(result);
                    response.render('visitorHome', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            } else {
                sqlAvgRating = `
                    SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
                    ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg.Rating'
                    FROM Property
                    JOIN Visit ON Visit.PropertyID = Property.ID
                    WHERE Property.IsPublic = 1
                    AND Property.ApprovedBy IS NOT NULL
                    GROUP BY Property.ID
                    HAVING AVG(Rating) = $search`;
            }
            connection.query(sqlAvgRating, [min, max], function(err, result, fields) {
                console.log(result);
                response.render('visitorHome', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        } else {
            var sql2params = `
                SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
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
                WHERE Property.IsPublic = 1
                AND Property.ApprovedBy IS NOT NULL
                AND ? = ?
                GROUP BY Property.ID`;

            connection.query(sql2params, [col, search], function(err, result, fields) {
                console.log(result);
                response.render('visitorHome', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        }
    }

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

    console.log(id);
    // console.log(username);
    // console.log(logged);
    // console.log(rating);

    var sqlHasLogged = `
    SELECT *
    FROM Visit
    WHERE PropertyID = ? AND Username = ?`;

    var sqlInit = `
    SELECT P . * , FarmItem.Name as FarmItem, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
    FROM (

    SELECT Property.Name, Property.Owner, Email AS 'Owner Email', Street AS Address, City, Zip, AVG(Rating) as 'Avg.Rating', Size AS 'Size (acres)', PropertyType AS
    TYPE , COUNT(* ) as Visits, (

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
    WHERE Property.ID = ?
    ) AS P
    JOIN Has ON Has.PropertyID = P.ID
    JOIN FarmItem ON FarmItem.Name = Has.ItemName`;

    var sqlLog = 'INSERT INTO Visit VALUES (?, ?, CURRENT_TIMESTAMP, ?);';

    var sqlUnlog = 'DELETE FROM Visit WHERE Username = ? AND PropertyID = ?';

    if (logged === 'false') {
        connection.query(sqlLog, [username, id, rating], function(err, result, fields) {
            connection.query(sqlInit, [id], function(err, result, fields) {
                // console.log(result);
                var crops = '';
                var animals = '';
                for (var i = 0; i < result.length; i++) {
                    if (result[i].Type == 'Animals') {
                        animals += result[i].FarmItem + ', ';
                    } else {
                        crops += result[i].FarmItem + ', ';
                    }
                }
                // console.log(crops);
                // console.log(animals);

                if (crops.length > 0) crops = crops.slice(0, -2);
                if (animals.length > 0) animals = animals.slice(0, -2);

                response.render('visitorDetails', {
                    logged: true,
                    username: username,
                    name: result[0].Name,
                    owner: result[0].Owner,
                    email: result[0]['Owner Email'],
                    visits: result[0].Visits,
                    address: result[0].Address,
                    city: result[0].City,
                    zip: result[0].Zip,
                    acres: result[0]['Size (acres)'],
                    avgRating: result[0]['Avg.Rating'],
                    type: result[0].TYPE,
                    public: result[0].Public,
                    commercial: result[0].Commercial,
                    id: result[0].ID,
                    crops: crops,
                    animals: animals
                });
            });

        });
    } else if (logged === 'true') {
        connection.query(sqlUnlog, [username, id], function(err, result, fields) {
            // console.log(result);
            connection.query(sqlInit, [id], function(err, result, fields) {
                // console.log(result);
                var crops = '';
                var animals = '';
                for (var i = 0; i < result.length; i++) {
                    if (result[i].Type == 'Animals') {
                        animals += result[i].FarmItem + ', ';
                    } else {
                        crops += result[i].FarmItem + ', ';
                    }
                }
                // console.log(crops);
                // console.log(animals);

                if (crops.length > 0) crops = crops.slice(0, -2);
                if (animals.length > 0) animals = animals.slice(0, -2);

                response.render('visitorDetails', {
                    logged: false,
                    username: username,
                    name: result[0].Name,
                    owner: result[0].Owner,
                    email: result[0]['Owner Email'],
                    visits: result[0].Visits,
                    address: result[0].Address,
                    city: result[0].City,
                    zip: result[0].Zip,
                    acres: result[0]['Size (acres)'],
                    avgRating: result[0]['Avg.Rating'],
                    type: result[0].TYPE,
                    public: result[0].Public,
                    commercial: result[0].Commercial,
                    id: result[0].ID,
                    crops: crops,
                    animals: animals
                });
            });
        });
    } else {
        connection.query(sqlHasLogged, [id, username], function(err, result, fields) {
            logged = result.length > 0 ? true : false;
            console.log("LOGGED: " + logged);
            connection.query(sqlInit, [id], function(err, result, fields) {
                // console.log(result);
                var crops = '';
                var animals = '';
                for (var i = 0; i < result.length; i++) {
                    if (result[i].Type == 'Animals') {
                        animals += result[i].FarmItem + ', ';
                    } else {
                        crops += result[i].FarmItem + ', ';
                    }
                }
                // console.log(crops);
                // console.log(animals);

                if (crops.length > 0) crops = crops.slice(0, -2);
                if (animals.length > 0) animals = animals.slice(0, -2);

                response.render('visitorDetails', {
                    logged: logged,
                    username: username,
                    name: result[0].Name,
                    owner: result[0].Owner,
                    email: result[0]['Owner Email'],
                    visits: result[0].Visits,
                    address: result[0].Address,
                    city: result[0].City,
                    zip: result[0].Zip,
                    acres: result[0]['Size (acres)'],
                    avgRating: result[0]['Avg.Rating'],
                    type: result[0].TYPE,
                    public: result[0].Public,
                    commercial: result[0].Commercial,
                    id: result[0].ID,
                    crops: crops,
                    animals: animals
                });
            });
        });
    }
});

// visitor history
app.post('/visitorHistory', function(request, response) {

    var username = request.body.username;
    if (signedIn) {
        var sql = `
        SELECT Property.Name, Visit.VisitDate, Visit.Rating, Property.ID
        FROM Visit JOIN Property ON Property.ID = Visit.PropertyID
        WHERE Visit.Username = ?`;
        connection.query(sql, [username], function(err, result, fields) {
            console.log(err);
            console.log(result);
            response.render('visitorHistory', {
                username: username,
                rows: result
            });

        });
    }

})

app.post('/allVisitorsInSystem', function(request, response) {
    if (request.body.deleteLog == "") {
        //deleteLog
        var user = request.body.usernameval;
        var sql = `DELETE FROM Visit WHERE Username = ?`;
        console.log(String(user))
        connection.query(sql, [user], function(err, result, fields) {
            console.log("deleteLog");
            var sql2 = `SELECT User.Username, User.Email, COUNT(VisitDate) as LoggedVisits
            FROM User LEFT JOIN Visit ON Visit.Username = User.Username
            WHERE User.UserType = 'VISITOR'
            GROUP BY Username`;
            connection.query(sql2, function(err, result, fields) {
                console.log(result);
                response.render('allVisitorsInSystem', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        });
    } else  {
        //deleteAcc
        var user = request.body.usernameval;
        console.log(user);
        var sql = `DELETE FROM User WHERE Username = ?`;
        connection.query(sql, [user], function(err, result, fields) {
            console.log("deleteAcc");
            var sql2 = `SELECT User.Username, User.Email, COUNT(VisitDate) as LoggedVisits
            FROM User LEFT JOIN Visit ON Visit.Username = User.Username
            WHERE User.UserType = 'VISITOR'
            GROUP BY Username`;
            connection.query(sql2, function(err, result, fields) {
                response.render('allVisitorsInSystem', {
                    username: userInfo.Username,
                    rows: result
                });
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
                } else {
                    response.render('adminLandingPage', {
                        username: userInfo.Username,
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
