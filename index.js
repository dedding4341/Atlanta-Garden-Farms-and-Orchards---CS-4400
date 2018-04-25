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
var chosenID;


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


app.get('/newVisitorRegistration', function(request, response) {
    response.render('newVisitorRegistration');
})

app.post('/newVisitorRegistration', function(request, response) {
    //response.render('newVisitorRegistration');
    console.log(request.body);
    var username = request.body.iU;
    var email = request.body.iE;

    var password = md5(request.body.iP1);
    var confpassword = md5(request.body.iP2);


    var sql = "SELECT * FROM User WHERE Username = ? OR Email = ?";
    connection.query(sql, [username, email], function(err, results, fields) {
        if (err) {
            return;
        };
        //console.log(results);
        if (results != '') {
            console.log("Username or Email exists.");
            response.render('usernameOrEmailExists');
        } else if (password != confpassword) {
            console.log("Password and confirm password does not match.");
            response.render('passwordNoMatch');
        } else {
            var insertsql = "INSERT INTO User VALUES (?,?,?,'VISITOR')";
            connection.query(insertsql, [username, email, password], function (err2, results2, fields2) {
                if (err2) {
                    return;
                };
            });
            console.log("New visitor added.");
            response.render('registrationSuccessful');
        };
    });
});

app.get('/newOwnerRegistration', function(request, response) {
    var sql = "SELECT * FROM FarmItem WHERE Type = 'ANIMAL' AND IsApproved = True";
    connection.query(sql, [], function(err, results, fields) {
        var animals = results;
        var sql = "SELECT * FROM FarmItem WHERE Type != 'ANIMAL' AND IsApproved = True";
        connection.query(sql, [], function(err, results, fields) {
            var crops = results;
            console.log(animals);

            response.render('newOwnerRegistration', {
                animalList: animals,
                cropList: crops
            })
        })
    })
    //response.render('newOwnerRegistration');
});

app.post('/newOwnerRegistration', function(request, response) {
    //response.render('newOwnerRegistration');
    var username = request.body.inputUsername;
    var email = request.body.inputEmail;
    var password = md5(request.body.inputPassword1);
    var confpassword = md5(request.body.inputPassword2);
    var propertyName = request.body.inputProperty;
    var streetAddress = request.body.inputStreetAddress;
    var city = request.body.inputCity;
    var zip = request.body.inputZip;
    zip = parseInt(zip);
    var acres = request.body.inputAcres;
    acres = parseFloat(acres);
    var propertyType = request.body.propertyType;
    var animalType = request.body.animalType;
    var cropType = request.body.cropType;
    var public = request.body.publicType;
    if (public == "Yes") {
        public = 1;
    } else {
        public = 0;
    }
    var commercial = request.body.commercialType;
    if (commercial == "Yes") {
        commercial = 1;
    } else {
        commercial = 0;
    }
    console.log(request.body);

    var sql = "SELECT * FROM User WHERE Username = ? OR Email = ?";
    connection.query(sql, [username, email], function(err, results, fields) {
        if (err) {
            return;
        };
        if (results != '') {
            console.log("Username or Email exits.");
            response.render('usernameOrEmailExists2');;
        } else if (password != confpassword) {
            console.log("Password and confirm password does not match.");
            response.render('passwordNoMatch2');
        } else {
            var sql = `SELECT MAX(ID) AS Id FROM Property`;
            connection.query(sql, function(err, result, fields) {
                console.log('result: '+result);
                var Id = result[0].Id;

                console.log(Id);
                Id = Id + 1;

                var sql = "INSERT INTO User VALUES (?, ?, ?, 'OWNER')";
                connection.query(sql, [username, email, password], function(err3, results3, fields3) {
                        var insertsql = "INSERT INTO Property VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)";
                        console.log(insertsql);
                        console.log(Id, propertyName, acres, commercial, public, city, zip, propertyType, username);
                        connection.query(insertsql, [Id, propertyName, acres, commercial, public, streetAddress,city, zip, propertyType, username], function (err2, results2, fields2) {
                            if (err2) {
                                //return;
                            };

                          // console.log("second query");
                          var sql3 = `INSERT INTO Has Values (?, ?);`;

                          connection.query(sql3, [Id, cropType], function(err, result, fields) {
                                console.log(cropType);
                                if (propertyType == 'FARM') {
                                    var sql4 =  `INSERT INTO Has Values (?, ?);`;
                                    connection.query(sql4, [Id, animalType], function(err,result, fields) {
                                        console.log(animalType);
                                    });
                                }
                            console.log("We were here")

                });
            });
            console.log("New Owner added.");
            response.render('registrationSuccessful');
        });
        });
    };
})});

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

app.post('/otherProperties', function(request, response){
  if (request.body.search == '') {
    var col = request.body.SearchField;
    var search = request.body.hiddenSearchTerm;

    // var min = request.body.min;
    // var max = request.body.max;

    if (col == 'Visits') {
      var sql = `SELECT Name, Address, City, Zip, Size,
                  TYPE , Public, Commercial, ID, isValid, Visits, (

                  CASE WHEN tempdata.avgrating >0
                  THEN tempdata.avgrating
                  ELSE 'N/A'
                  END
                  ) AS Rating
                  FROM (

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
                  ) AS Commercial, ID, (

                  CASE WHEN ApprovedBy IS NULL
                  THEN 'False'
                  ELSE 'True'
                  END
                  ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                  FROM Property
                  LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                  WHERE Owner != ?
                  GROUP BY ID
                  HAVING COUNT(*) = ?
                ) AS tempdata`;
                connection.query(sql, [userInfo.Username, search], function(err, result, fields) {
                  response.render('otherProperties', {
                    username: userInfo.Username,
                    allProperty: result
                  });
                });
    } else if (col == "Avg. Rating") {
          var sql = `SELECT Name, Address, City, Zip, Size,
                      TYPE , Public, Commercial, ID, isValid, Visits, (

                      CASE WHEN tempdata.avgrating >0
                      THEN tempdata.avgrating
                      ELSE 'N/A'
                      END
                      ) AS Rating
                      FROM (

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
                      ) AS Commercial, ID, (

                      CASE WHEN ApprovedBy IS NULL
                      THEN 'False'
                      ELSE 'True'
                      END
                      ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                      FROM Property
                      LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                      WHERE Owner != ?
                      GROUP BY ID
                      HAVING AVG(Rating) = ?
                    ) AS tempdata`;

                    connection.query(sql, [userInfo.Username,search ], function(err, result, fields){
                          console.log('avge ratingggggggggggg');
                          console.log(result);
                          response.render('otherProperties', {
                            username: userInfo.Username,
                            allProperty: result
                          });
                    });


    } else {

            var sql = `SELECT Name, Address, City, Zip, Size,
                        TYPE , Public, Commercial, ID, isValid, Visits, (

                        CASE WHEN tempdata.avgrating >0
                        THEN tempdata.avgrating
                        ELSE 'N/A'
                        END
                        ) AS Rating
                        FROM (

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
                        ) AS Commercial, ID, (

                        CASE WHEN ApprovedBy IS NULL
                        THEN 'False'
                        ELSE 'True'
                        END
                        ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                        FROM Property
                        LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                        WHERE Owner != ? AND ` + col + ` LIKE ?
                        GROUP BY ID
                        ) AS tempdata
                `;

          connection.query(sql, [userInfo.Username, "%"+ search + "%"], function(err, result, fields){
                response.render('otherProperties', {
                  username: userInfo.Username,
                  allProperty: result
                });
          });

      }
  }
});

app.post('/viewPropertyDetails', function(request, response) {
    var id = request.body.idSelection;
    var sql = `SELECT P . * , FarmItem.Name as FarmItem, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
              FROM (

              SELECT Property.Name, Property.Owner, Email AS 'Email', Street AS Address, City, Zip, AVG(Rating) as 'Rating', Size AS 'Size', PropertyType AS
              PropType , COUNT(* ) as Visits, (

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
              WHERE Property.ID =?
              ) AS P
              JOIN Has ON Has.PropertyID = P.ID
              JOIN FarmItem ON FarmItem.Name = Has.ItemName`;
    connection.query(sql, [id], function(err, result, fields) {
        var crops = '';
        var animals = '';
        for (var i = 0; i < result.length; i++) {
            if (result[i].TYPE == 'Animals') {
                animals += result[i].FarmItem + ', ';
            } else {
                crops += result[i].FarmItem + ', ';
            }
        }
        if (crops.length > 0) crops = crops.slice(0, -2);
        if (animals.length > 0) animals = animals.slice(0, -2);
        response.render('propertyDetails', {
              crops : crops,
              animals : animals,
              name : result[0].Name,
              owner : result[0].Owner,
              email : result[0].Email,
              visits : result[0].Visits,
              address: result[0].Address,
              city: result[0].City,
              zip: result[0].Zip,
              size: result[0].Size,
              type: result[0].PropType,
              isPublic: result[0].Public,
              isCommercial:result[0].Commercial,
              id: result[0].ID,
        });
        // console.log('what is returned');
        // console.log(result);
    });
});


app.get('/ownerProperties', function(request, response) {

    if (signedIn) {
        response.render('ownerProperties', {
            username: userInfo.Username,
            personalProperty: myPropertyInfo,
            allProperty: allPropertyInfo
        });
    }

});

//takes you to the mamage property screen from owner properties
app.post('/ownerProperties', function(request, response) {
  console.log("clicked on search");
  console.log(request.body);
  // console.log('cho');
  // console.log(chosenID);
    // console.log('submit');
    // console.log('I called the post');
    // console.log(request.body);
    // if ( typeof request[0] !== 'undefined' && request.body.search[1] == '') {

    // }
     if (request.body.successful == '') {
      console.log('5');
      var sql = `SELECT Name, Address, City, Zip, Size,
                TYPE , Public, Commercial, ID, isValid, Visits, (

                CASE WHEN tempdata.avgrating >0
                THEN tempdata.avgrating
                ELSE  'N/A'
                END
                ) AS Rating
                FROM (

                SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
                TYPE , (

                CASE WHEN IsPublic =1
                THEN  'True'
                ELSE  'False'
                END
                ) AS Public, (

                CASE WHEN IsCommercial =1
                THEN  'True'
                ELSE  'False'
                END
                ) AS Commercial, ID, (

                CASE WHEN ApprovedBy IS NULL
                THEN  'False'
                ELSE  'True'
                END
                ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                FROM Property
                LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                WHERE Owner =  ?
                GROUP BY ID
                ) AS tempdata`;
          connection.query(sql, [userInfo.Username], function(err, result, fields) {
               response.render('ownerProperties', {
                 username: userInfo.Username,
                 personalProperty: result
               });
          });
    } else {
        console.log('1');
        var col = request.body.column;
        var search = request.body.search[0];

        // var min = request.body.min;
        // var max = request.body.max;

        if (col == 'Visits') {
          console.log('2');
          var sql = `SELECT Name, Address, City, Zip, Size,
                      TYPE , Public, Commercial, ID, isValid, Visits, (

                      CASE WHEN tempdata.avgrating >0
                      THEN tempdata.avgrating
                      ELSE 'N/A'
                      END
                      ) AS Rating
                      FROM (

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
                      ) AS Commercial, ID, (

                      CASE WHEN ApprovedBy IS NULL
                      THEN 'False'
                      ELSE 'True'
                      END
                      ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                      FROM Property
                      LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                      WHERE Owner = ?
                      GROUP BY ID
                      HAVING COUNT(*) = ?
                    ) AS tempdata`;
                    connection.query(sql, [userInfo.Username, search], function(err, result, fields) {
                      response.render('ownerProperties', {
                        username: userInfo.Username,
                        personalProperty: result
                      });
                    });
        } else if (col == "Avg. Rating") {
          console.log('3');
              var sql = `SELECT Name, Address, City, Zip, Size,
                          TYPE , Public, Commercial, ID, isValid, Visits, (

                          CASE WHEN tempdata.avgrating >0
                          THEN tempdata.avgrating
                          ELSE 'N/A'
                          END
                          ) AS Rating
                          FROM (

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
                          ) AS Commercial, ID, (

                          CASE WHEN ApprovedBy IS NULL
                          THEN 'False'
                          ELSE 'True'
                          END
                          ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                          FROM Property
                          LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                          WHERE Owner = ?
                          GROUP BY ID
                          HAVING AVG(Rating) = ?
                        ) AS tempdata`;

                        connection.query(sql, [userInfo.Username,search ], function(err, result, fields){
                              console.log('avge ratingggggggggggg');
                              console.log(result);
                              response.render('ownerProperties', {
                                username: userInfo.Username,
                                personalProperty: result
                              });
                        });


        }else {
              console.log("4");
                var sql = `SELECT Name, Address, City, Zip, Size,
                            TYPE , Public, Commercial, ID, isValid, Visits, (

                            CASE WHEN tempdata.avgrating >0
                            THEN tempdata.avgrating
                            ELSE 'N/A'
                            END
                            ) AS Rating
                            FROM (

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
                            ) AS Commercial, ID, (

                            CASE WHEN ApprovedBy IS NULL
                            THEN 'False'
                            ELSE 'True'
                            END
                            ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                            FROM Property
                            LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                            WHERE Owner = ? AND ` + col + ` LIKE ?
                            GROUP BY ID
                            ) AS tempdata
                    `;

              connection.query(sql, [userInfo.Username, "%"+ search + "%"], function(err, result, fields){

                    response.render('ownerProperties', {
                      username: userInfo.Username,
                      personalProperty: result
                    });
              });

          }
    }



});

app.post('/success', function(request, response) {
  console.log(request.body);
  console.log('6');
        if (request.body.deleteProperty == '') {
          var sql = `DELETE FROM Property
                    WHERE ID = ?`;
          connection.query(sql, [chosenID], function(err, result, fields) {
                response.render('ownerProperties', {
                  username: userInfo.Username,
                  personalProperty: myPropertyInfo,
                  allProperty: allPropertyInfo
                });
          });
        }
        if (request.body.addCropBtn == '') {
          var name = request.body.newCrop;
          var sql = `INSERT INTO Has
                    VALUES (?, ?)`;
          connection.query(sql, [chosenID, name], function(err, result, fields) {
            response.render('success');
          });
        }

        if (request.body.addAnimalBtn == '') {
          var name = request.body.newAnimal;
          var sql = `INSERT INTO Has
                    VALUES (?, ?)`;
          connection.query(sql, [chosenID, name], function(err, result, fields) {
            response.render('success');
          });
        }

        if (request.body.removeCropBtn == ''){
          var name = request.body.removeCrop;
          var sql = `DELETE FROM Has WHERE ItemName = ? AND PropertyID = ?`;
          connection.query(sql, [name, chosenID], function(err, result, fields) {
              response.render('sucess');
          });

        }
        if (request.body.removeAnimalBtn =='') {
          var name = request.body.removeAnimal;
          var sql = `DELETE FROM Has WHERE ItemName = ? AND PropertyID = ?`;
          connection.query(sql, [name, chosenID], function(err, result, fields) {
              response.render('success');
          });
        }
        if (request.body.submitRequest == '') {
          var newName = request.body.newItemName;
          var newType = request.body.newItemType;
          var sql = `INSERT INTO FarmItem VALUES (?, False, ?);`;
          connection.query(sql, [newName, newType], function(err, result, fields) {
              response.render('success');
          });
        }
        if (request.body.deleteProperty == '') {
          // console.log(chosenID);
            var sql = `DELETE FROM Property
                      WHERE ID = ?`;
            connection.query(sql, [chosenID], function(err,result, fields){
              response.render('success');
            });

        }
        if (request.body.saveChanges == '') {
          var name = request.body.name;
          var address = request.body.address;
          var city = request.body.city;
          var zip = request.body.zip;
          zip = parseInt(zip);
          var size = request.body.size;
          size = parseInt(size);
          var isCommercial = request.body.isCommercial;
          var isPublic= request.body.isPublic;
          if (isPublic == 'True') {
            isPublic = 1;
            console.log('made it true');
          } else {
            isPublic = 0;
            console.log('made it false');
          }
          if (isCommercial == 'True') {
            isCommercial = 1;
          } else {
            isCommercial = 0;
          }
          isCommercial = parseInt(isCommercial);
          isPublic - parseInt(isPublic);
          var sql = `UPDATE Property
                    SET Name = ?, Size = ?, IsCommercial = ?, IsPublic = ?, Street = ?,City = ?, Zip = ?
                    WHERE ID = ?`;
          connection.query(sql, [name, size, isCommercial, isPublic, address, city, zip, chosenID ], function(err, result, fields) {

            var sql = `SELECT
                        Name,
                        Street AS Address, City, Zip, Size, PropertyType AS
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
                      ) AS Commercial, ID, (

                      CASE WHEN ApprovedBy IS NULL
                      THEN 'False'
                      ELSE 'True'
                      END
                    ) AS isValid, COUNT( * ) AS Count , AVG( Rating ) AS Rating
                      FROM Property, Visit
                      WHERE Owner = ?
                      GROUP BY ID`;
            connection.query(sql, [userInfo.Username], function(err, result, fields) {
                myPropertyInfo = result;
                console.log(result);

                response.render('success', {


                  username: userInfo.Username,
                  personalProperty: myPropertyInfo,
                  allProperty: allPropertyInfo
                });
              });


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
                            response.render('success', {
                            username: userInfo.Username,
                            personalProperty: myPropertyInfo,
                            allProperty: allPropertyInfo
                          });
                        });
                    } else {
                        response.render('success', {
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

});

app.post('/manageProperty', function(request, response)
{
 console.log('started manage');
 console.log(request.body);
 console.log(id);
   var id = request.body.ID;
   id = parseInt(id);
   chosenID = id;
   // console.log('Started');
   // console.log('body');
   // console.log(request.body);
   var name;
   var type = 'FARM';
   var address;
   var isPublic;
   var address;
   var isPublic;
   var city;
   var isCommercial;
   var size;
   var croplist;
   var animallist;
   var addCrops;
   var addAnimals;

   var sql = `SELECT ItemName
             FROM Has
             JOIN FarmItem ON FarmItem.Name = Has.ItemName
             WHERE Has.PropertyID = ? AND FarmItem.Type != 'ANIMAL'`;
  connection.query(sql, [id], function(err, result, fields) {
        croplist = result;
        // console.log('croplist');
        // console.log(croplist);
        console.log('got crops');
        console.log(result);
        var animalsql = `SELECT ItemName
                        FROM Has
                        JOIN FarmItem ON FarmItem.Name = Has.ItemName
                        WHERE Has.PropertyID = ? AND FarmItem.Type = 'ANIMAL'`;
        connection.query(animalsql, [id], function(err, result, fields){
              animallist = result;
              console.log('got animals');
              console.log(result);
              // console.log('animals');
              // console.log(animallist);
              var newCropsql = `SELECT Name
                                FROM FarmItem
                                WHERE FarmItem.Type != 'ANIMAL'
                                AND FarmItem.IsApproved = True
                                AND NOT
                                EXISTS (
                                SELECT *
                                FROM Has
                                WHERE Has.ItemName = FarmItem.Name
                                AND Has.PropertyID =?)` ;
              connection.query(newCropsql, [id], function(err, result, fields) {
                  addCrops = result;

                  console.log('got add crops');
                  console.log(result);
                  // console.log(result);
                  var newAnimalsql = `SELECT Name
                                      FROM FarmItem
                                      WHERE FarmItem.Type = 'ANIMAL'
                                      AND FarmItem.IsApproved = True
                                      AND NOT
                                      EXISTS (
                                      SELECT *
                                      FROM Has
                                      WHERE Has.ItemName = FarmItem.Name
                                      AND Has.PropertyID =?)`;
                  connection.query(newAnimalsql, [id], function(err, result, fields) {
                        addAnimals = result;
                        console.log('got add animals');
                        console.log(result);
                        // console.log(result);

                        var propDetSql = `SELECT
                                          Name,
                                          Street as Address,
                                          City,
                                          Zip,
                                          Size,
                                          PropertyType as Type,
                                          (CASE WHEN IsPublic =1 THEN 'True' ELSE 'False' END) AS Public,
                                          (CASE WHEN IsCommercial =1 THEN 'True' ELSE 'False' END) AS Commercial,
                                          ID
                                          FROM Property
                                          WHERE Property.Owner = ? and Property.ID = ?`;
                        connection.query(propDetSql, [userInfo.Username, id], function(err, result, fields) {
                              console.log('this is property details');
                              console.log(result);
                              // console.log(result[0].Name);
                              response.render('manageProperty', {
                                propID: chosenID,
                                address: result[0].Address,
                                propType: result[0].Type,
                                city: result[0].City,
                                zip: result[0].Zip,
                                size: result[0].Size,
                                name: result[0].Name,
                                isPublic: result[0].Public,
                                isCommercial: result[0].Commercial,
                                cropList: croplist,
                                animalList: animallist,
                                addAnimalList: addAnimals,
                                addCropList: addCrops
                                //pass in prop name
                        });

                  });
              });
    });


  //
        });
  //
  });

});


app.get('/allOwnersInSystem', function(request, response) {

    if (signedIn) {
        var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Property.Owner IS NULL THEN 0 ELSE 1 END) AS NumProperties
FROM User
LEFT JOIN Property ON Property.Owner = User.Username
WHERE User.UserType = 'OWNER'
GROUP BY User.Username`;
        connection.query(sql, function(err, result, fields) {
            response.render('allOwnersInSystem', {
                username: userInfo.Username,
                rows: result
            });
        });
    }

});

app.get('/allVisitorsInSystem', function(request, response) {

    if (signedIn) {
        var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Visit.Username IS NULL THEN 0 ELSE 1 END) as LoggedVisits
        FROM User LEFT JOIN Visit ON Visit.Username = User.Username
        WHERE User.UserType = 'VISITOR'
        GROUP BY Username`;
        connection.query(sql, function(err, result, fields) {
            console.log(result);
            response.render('allVisitorsInSystem', {
                username: userInfo.Username,
                rows: result
            });
        });
    }
});


app.post('/allOwnersInSystem', function(request, response) {
    console.log(request.body);
    if (signedIn) {
        if (request.body.usernameval != undefined) {
            var user = request.body.usernameval;
            console.log(user);
            var sql = `DELETE FROM User WHERE Username = ?`;
            connection.query(sql, [user], function(err, result, fields) {
                console.log("deleteAcc");
                var sql2 = `SELECT User.Username, User.Email, SUM(CASE WHEN Property.Owner IS NULL THEN 0 ELSE 1 END) AS NumProperties
                            FROM User
                            LEFT JOIN Property ON Property.Owner = User.Username
                            WHERE User.UserType = 'OWNER'
                            GROUP BY User.Username`;
                connection.query(sql2, function(err, result, fields) {
                    response.render('allOwnersInSystem', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            });
        } else {
            var col = request.body.column;
            var search = request.body.search;
            if (col == "Number of Properties") {
                col = "NumProperties";
            }
            if (col == "NumProperties") {
                var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Property.Owner IS NULL THEN 0 ELSE 1 END) as NumProperties
                FROM User LEFT JOIN Property ON Property.Owner = User.Username
                WHERE User.UserType = 'OWNER'
                GROUP BY User.Username
                HAVING SUM(CASE WHEN Property IS NULL THEN 0 ELSE 1 END) = ?`;
                var search2 = parseInt(search);
                connection.query(sql, [search], function(err, result, fields) {
                    console.log(sql);
                    console.log(result);
                    console.log(err);
                    response.render('allOwnersInSystem', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            } else {
                var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Property.Owner IS NULL THEN 0 ELSE 1 END) as NumProperties
    FROM User JOIN Property ON Property.Owner = User.Username
    WHERE User.UserType = 'OWNER' AND `+col+` LIKE ?`;
    connection.query(sql, ["%"+search+"%"], function(err, result, fields) {
        console.log(sql);
        console.log(result);
        console.log(err);
        response.render('allOwnersInSystem', {
            username: userInfo.Username,
            rows: result
        });
    });
            }

        }
    }
});

app.get('/viewConfirmedProperties', function(request, response) {
    if (signedIn) {
        var sql = `SELECT Name, Street, City, Zip, Size, PropertyType AS
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
) AS Commercial, ID, ApprovedBy AS VerifiedBy, AVG(
CASE WHEN RATING >0
THEN RATING
ELSE 0
END ) AS Rating
FROM Property
LEFT JOIN Visit ON Visit.PropertyID = Property.ID
WHERE ApprovedBy IS NOT NULL
GROUP BY Name`;
        connection.query(sql, function(err, result, fields) {
            response.render('viewConfirmedProperties', {
                username: userInfo.Username,
                rows: result
            });
        });
    }
});

app.post('/adminSuccess', function(request, response) {
    if (signedIn) {
      if (request.body.saveChanges == '') {
        var isPublic = request.body.isPublic;
        var isCommercial = request.body.isCommercial;
        if (isPublic == 'True') {
          isPublic = 1;
          console.log('made it true');
        } else {
          isPublic = 0;
          console.log('made it false');
        }
        if (isCommercial == 'True') {
          isCommercial = 1;
        } else {
          isCommercial = 0;
        }
        isCommercial = parseInt(isCommercial);
        isPublic - parseInt(isPublic);
        console.log('look here');
        console.log(request.body);
         var sql = `UPDATE Property
                   SET Name = ?, Size = ?, IsCommercial = ?, IsPublic = ?, Street = ?,City = ?, Zip = ?, ApprovedBy = ?
                   WHERE ID = ?`;

         connection.query(sql, [request.body.name, request.body.size,isCommercial, isPublic, request.body.address, request.body.city, request.body.zip, userInfo.Username, request.body.id],function(err, result, fields) {
             response.render('adminSuccess');
         });
      } else if (request.body.deleteProperty == ''){
         var sql =`DELETE FROM Property
                   WHERE ID = ?`;
         connection.query(sql, [ request.body.id],function(err, result, fields) {
             response.render('adminSuccess');
         });
      } else if (request.body.addCropBtn == '') {
        var name = request.body.newCrop;
        var sql = `INSERT INTO Has
                  VALUES (?, ?)`;
        connection.query(sql, [request.body.id, name], function(err, result, fields) {
          response.render('adminSuccess');
        });
      } else if (request.body.addAnimalBtn == '') {
        var name = request.body.newAnimal;
        var sql = `INSERT INTO Has
                  VALUES (?, ?)`;
        connection.query(sql, [request.body.id, name], function(err, result, fields) {
          response.render('adminSuccess');
        });
      }else if (request.body.removeCropBtn == ''){
        var name = request.body.removeCrop;
        var sql = `DELETE FROM Has WHERE ItemName = ? AND PropertyID = ?`;

        connection.query(sql, [name, request.body.id], function(err, result, fields) {
            response.render('adminSuccess');
        });

      } else if (request.body.removeAnimalBtn =='') {
        var name = request.body.removeAnimal;
        var sql = `DELETE FROM Has WHERE ItemName = ? AND PropertyID = ?`;
        connection.query(sql, [name, request.body.id], function(err, result, fields) {
            response.render('adminSuccess');
        });
      }
    }
});

app.get('/adminLandingPage', function(request, response) {
    if (signedIn) {
        response.render('adminLandingPage');
    }
});

app.post('/adminLandingPage', function(request, response) {
    var user = request.body.column;
    console.log(user);
    response.render('adminLandingPage');
});

app.get('/viewUnconfirmedProperties', function(request, response) {

    if (signedIn) {
        var sql = `SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
                    CASE WHEN IsPublic =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Public, (
                    CASE WHEN IsCommercial =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Commercial, ID, Owner
                    FROM Property
                    WHERE ApprovedBy IS NULL`;
        connection.query(sql, function(err, result, fields) {
            console.log(result);
            response.render('viewUnconfirmedProperties', {
                username: userInfo.Username,
                rows: result
            });
        });
    }
});


app.post('/viewConfirmedProperties', function(request, response) {
    if (signedIn) {
        if (request.body.usernameval != undefined) {
            var user = request.body.usernameval;
            console.log(user);
            var sql = `DELETE FROM User WHERE Username = ?`;
            response.render('manageSelectedProperty', {
            });
        } else {
            var col = request.body.column;
            var search = request.body.search;
            if (col == "Address") {
                col = "Street";
            }
            if (col == "Commercial") {
                col = "IsCommercial";
                console.log("current col: " + col);
                if (search == "True") {
                    search = "1";
                } else {
                    search = "0";
                }
            }
            if (col == "Public") {
                col = "IsPublic";
                if (search == "True") {
                    search = "1";
                } else {
                    search = "0";
                }
            }
            if (col == "Verified by") { // check this
              console.log("ASDLFJASDJKFAJSDFLKAJSDFLJKASDFLASDJFASDFJKL");
              col = "ApprovedBy";
            }
            if (col == "Type") {
                col = "PropertyType";
            }
            if (col == "Rating") {
              var sql = `SELECT Name, Street, City, Zip, Size, PropertyType AS
                          Type , (

                          CASE WHEN IsPublic =1
                          THEN 'True'
                          ELSE 'False'
                          END
                          ) AS Public, (

                          CASE WHEN IsCommercial =1
                          THEN 'True'
                          ELSE 'False'
                          END
                          ) AS Commercial, ID, ApprovedBy AS VerifiedBy, AVG(Rating) AS Rating
                          FROM Property
                          LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                          WHERE ApprovedBy IS NOT NULL
                          GROUP BY Name
                          HAVING AVG(Rating) = ?`
              connection.query(sql, [search], function(err, result, fields) {
                console.log(sql);
                console.log(result);
                console.log(err);
                response.render('viewConfirmedProperties', {
                    username: userInfo.Username,
                    rows: result
                });
              });
            } else {
                if (col == "Zip") {
                  var sql = `SELECT Name, Street, City, Zip, Size, PropertyType AS
                                Type , (

                                CASE WHEN IsPublic =1
                                THEN 'True'
                                ELSE 'False'
                                END
                                ) AS Public, (

                                CASE WHEN IsCommercial =1
                                THEN 'True'
                                ELSE 'False'
                                END
                                ) AS Commercial, ID, ApprovedBy AS VerifiedBy, AVG(Rating) AS Rating
                                FROM Property
                                LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                                WHERE ApprovedBy IS NOT NULL
                                AND `+col+` = ?
                                GROUP BY Name`;
                  connection.query(sql, [search], function(err, result, fields) {
                    console.log(sql);
                    console.log(result);
                    console.log(err);
                    response.render('viewConfirmedProperties', {
                        username: userInfo.Username,
                        rows: result
                    });
                  });
                } else {
                  console.log("asdlkjfalksdjfal;sdkfj;alskdjf " + col);
                  var sql = `SELECT Name, Street, City, Zip, Size, PropertyType AS
                              Type , (

                              CASE WHEN IsPublic =1
                              THEN 'True'
                              ELSE 'False'
                              END
                              ) AS Public, (

                              CASE WHEN IsCommercial =1
                              THEN 'True'
                              ELSE 'False'
                              END
                              ) AS Commercial, ID, ApprovedBy AS VerifiedBy, AVG(Rating) AS Rating
                              FROM Property
                              LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                              WHERE ApprovedBy IS NOT NULL
                              AND `+col+` LIKE ?
                              GROUP BY Name`;
                  connection.query(sql, ["%" + search + "%"], function(err, result, fields) {
                    console.log(sql);
                    console.log(result);
                    console.log(err);
                    response.render('viewConfirmedProperties', {
                        username: userInfo.Username,
                        rows: result
                    });
                  });
                }
            }
        }
    }
});

app.post('/viewUnconfirmedProperties', function(request, response) {
    if (request.body.column != undefined) {
        var col = request.body.column;
        var search = request.body.search;
        if (col == "Address") {
            col = "Street";
        }
        if (col == "Commercial") {
            col = "IsCommercial";
            console.log("current col: " + col);
            if (search == "True") {
                search = "1";
            } else {
                search = "0";
            }
        }
        if (col == "Public") {
            col = "IsPublic";
            if (search == "True") {
                search = "1";
            } else {
                search = "0";
            }
        }
        if (col == "Type") {
            col = "PropertyType";
        }
        if (col != "Size") {
          console.log(col + " = " + search);
          var sql = `SELECT Name, Street, City, Zip, Size, PropertyType as Type, (CASE WHEN IsPublic =1 THEN 'True' ELSE 'False' END) AS Public, (CASE WHEN IsCommercial =1 THEN 'True' ELSE 'False' END ) AS Commercial, ID, Owner FROM Property WHERE ApprovedBy IS NULL and `+col+` LIKE ?`;
          connection.query(sql, ["%"+search+"%"], function(err, result, fields) {
              console.log(sql);
              console.log(result);
              console.log(err);
              response.render('viewUnconfirmedProperties', {
                  username: userInfo.Username,
                  rows: result
              });
          });
        } else {
          console.log(col + " = " + search);
          var sql = `SELECT Name, Street, City, Zip, Size, PropertyType as Type, (CASE WHEN IsPublic =1 THEN 'True' ELSE 'False' END) AS Public, (CASE WHEN IsCommercial =1 THEN 'True' ELSE 'False' END ) AS Commercial, ID, Owner FROM Property WHERE ApprovedBy IS NULL and `+col+` = ?`;
          connection.query(sql, [search], function(err, result, fields) {
              console.log(sql);
              console.log(result);
              console.log(err);
              response.render('viewUnconfirmedProperties', {
                  username: userInfo.Username,
                  rows: result
              });
          });
        }
    } else {
        console.log("aaaaaaaaaaaaa");
        var col = request.body.column;
        var search = request.body.search;
        var sql = `SELECT Name, Street, City, Zip, Size, PropertyType as Type, (
                    CASE WHEN IsPublic =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Public, (
                    CASE WHEN IsCommercial =1
                    THEN 'True'
                    ELSE 'False'
                    END
                    ) AS Commercial, ID, Owner
                    FROM Property
                    WHERE ApprovedBy IS NULL and `+col+` = ?`;
        connection.query(sql, [search], function(err, result, fields) {
            console.log(sql);
            console.log(result);
            console.log(err);
            response.render('viewUnconfirmedProperties', {
                username: userInfo.Username,
                rows: result
            });
        });
    }
});

app.post('/manageSelectedProperty', function(request, response) {
    if (signedIn) {
        console.log(request.body);
        var id = request.body.id;
         var sql = `SELECT ItemName
                   FROM Has
                   JOIN FarmItem ON FarmItem.Name = Has.ItemName
                   WHERE Has.PropertyID = ? AND FarmItem.Type != 'ANIMAL'`;
        connection.query(sql, [id], function(err, result, fields) {
            cropList = result;
            // console.log('croplist');
            // console.log(croplist);
            var animalsql = `SELECT ItemName
                            FROM Has
                            JOIN FarmItem ON FarmItem.Name = Has.ItemName
                            WHERE Has.PropertyID = ? AND FarmItem.Type = 'ANIMAL'`;
            connection.query(animalsql, [id], function(err, result, fields) {
                animalList = result;
                // console.log('animals');
                // console.log(animallist);
                var newCropsql = `SELECT Name
                                  FROM FarmItem
                                  WHERE FarmItem.Type != 'ANIMAL'
                                  AND FarmItem.IsApproved = True
                                  AND NOT
                                  EXISTS (
                                  SELECT *
                                  FROM Has
                                  WHERE Has.ItemName = FarmItem.Name
                                  AND Has.PropertyID =?)` ;
                connection.query(newCropsql, [id], function(err, result, fields) {
                    addCrops = result;
                    // console.log('add crops');
                    // console.log(result);
                    var newAnimalsql = `SELECT Name
                                        FROM FarmItem
                                        WHERE FarmItem.Type = 'ANIMAL'
                                        AND FarmItem.IsApproved = True
                                        AND NOT
                                        EXISTS (
                                        SELECT *
                                        FROM Has
                                        WHERE Has.ItemName = FarmItem.Name
                                        AND Has.PropertyID =?)`;
                    connection.query(newAnimalsql, [id], function(err, result, fields) {
                        addAnimals = result;
                        var finalSql = `
                            SELECT P . * , FarmItem.Name as item, (CASE WHEN FarmItem.Type = 'ANIMAL' THEN 'Animals' ELSE 'Crops' END) as Type
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
                            WHERE Property.ID = ?
                            ) AS P
                            JOIN Has ON Has.PropertyID = P.ID
                            JOIN FarmItem ON FarmItem.Name = Has.ItemName`;

                        connection.query(finalSql, [id], function(err, result, fields) {
                            console.log(result);
                            console.log(cropList);
                            console.log(animalList);
                            console.log(addCrops);
                            console.log(addAnimals);
                            // var crops = [];
                            // var animals = [];
                            // for (var i = 0; i < result.length; i++) {
                            //     if (result[i].Type == 'Animals') {
                            //         animals.push(result[i].item);
                            //     } else {
                            //         crops.push(result[i].item);
                            //     }
                            // }

                            // console.log(crops);
                            // console.log(animals);
                            response.render('manageSelectedProperty', {
                                id: id,
                                name: result[0].Name,
                                owner: result[0].Owner,
                                email: result[0]['Owner Email'],
                                address: result[0].Address,
                                city: result[0].City,
                                zip: result[0].Zip,
                                acres: result[0]['Size (acres)'],
                                avgRating: result[0]['AVG( Rating )'],
                                type: result[0].TYPE,
                                public: result[0].Public,
                                commercial: result[0].Commercial,
                                cropList: cropList,
                                animalList: animalList,
                                addCrops: addCrops,
                                addAnimals: addAnimals
                            });
                        });
                    });
                });
            });
        });
    }
});

app.post('/approvedAnimalsCrops', function(request, response) {
    console.log(request.body);
    if (request.body.column != undefined) {
        var col = request.body.column;
        var search = request.body.search;
        sqlsearch = `
        SELECT Name, Type
        FROM FarmItem
        WHERE IsApproved = True AND ` + col + ` = ?`;
        console.log(sqlsearch);
        connection.query(sqlsearch, [search], function(err, result, fields) {
            console.log(result);
            response.render('approvedAnimalsCrops', {
                username: userInfo.Username,
                rows: result
            });
        });
    } else if (request.body.type != undefined) {
        var type = request.body.type;
        var item = request.body.name;
        var sql = `INSERT INTO FarmItem VALUES (?, 1, ?)`;
        connection.query(sql, [item, type], function(err, result, fields) {
            var sql2 = `SELECT Name, Type
            FROM FarmItem
            WHERE IsApproved = True`
            connection.query(sql2, function(err, result, fields) {
                response.render('approvedAnimalsCrops', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        });

    } else {
        if (signedIn) {
            var user = request.body.usernameval;
            var sql = `DELETE FROM FarmItem
            WHERE Name = ?`;
            connection.query(sql, [user], function(err, result, fields) {
                var sql2 = `SELECT Name, Type
                FROM FarmItem
                WHERE IsApproved = True`
                connection.query(sql2, function(err, result, fields) {
                    response.render('approvedAnimalsCrops', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            });
        }
    }
})

app.get('/approvedAnimalsCrops', function(request, response) {
    if (signedIn) {
        var sql = `SELECT Name, Type
        FROM FarmItem
        WHERE IsApproved = True`;
        connection.query(sql, function(err, result, fields) {
            response.render('approvedAnimalsCrops', {
                username: userInfo.Username,
                rows: result
            });
        });
    }

})

app.get('/pendingApprovalAnimalsCrops', function(request, response) {
    if (signedIn) {
        var sql = `SELECT Name, Type
        FROM FarmItem
        WHERE IsApproved = False`;
        connection.query(sql, function(err, result, fields) {
            response.render('pendingApprovalAnimalsCrops', {
                username: userInfo.Username,
                rows: result
            });
        });
    }

})

app.post('/pendingApprovalAnimalsCrops', function(request, response) {
    console.log(request.body);
    if (signedIn) {
        if (request.body.approve == "") {
            console.log("approve");
            var user = request.body.usernameval;
            var sql = `UPDATE FarmItem
            SET IsApproved = True
            WHERE Name = ?`;
            connection.query(sql, [user], function(err, result, fields) {
                var sql2 = `SELECT Name, Type
                FROM FarmItem
                WHERE IsApproved = False`
                connection.query(sql2, function(err, result, fields) {
                    response.render('pendingApprovalAnimalsCrops', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            });
        } else {
            console.log("delete");
            var user = request.body.usernameval;
            var sql = `DELETE FROM FarmItem
            WHERE Name = ?`;
            connection.query(sql, [user], function(err, result, fields) {
                var sql2 = `SELECT Name, Type
                FROM FarmItem
                WHERE IsApproved = False`
                connection.query(sql2, function(err, result, fields) {
                    response.render('pendingApprovalAnimalsCrops', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            });
        }
    }
})

// initial visitor page
app.get('/visitorHome', function(request, response) {
    if (signedIn) {
        var sql = `
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
            LEFT JOIN Visit ON Visit.PropertyID = Property.ID
            WHERE Property.IsPublic = 1
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
        col = 'PropertyType';
    } else if (col == 'Public') {
        col = 'IsPublic';
    } else if (col == 'Commercial') {
        col = 'IsCommercial';
    }

    /*

    Name = Name
    Address = Street
    City = City
    Zip = Zip
    Size = Size
    Type = PropertyType
    Public = IsPublic
    Commercial = IsCommercial
    ID = ID

    */

    if (signedIn) {
        if (col == 'Visits') {
            var sqlVisits;
            if (search == '') {
                sqlVisits = `
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
                     LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                     WHERE Property.IsPublic = 1
                     AND Property.ApprovedBy IS NOT NULL
                     GROUP BY Property.ID
                     HAVING COUNT(*) BETWEEN ? AND ?`;

                connection.query(sqlVisits, [min, max], function(err, result, fields) {
                    console.log(err);
                    console.log(result);
                    response.render('visitorHome', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            } else {
                sqlVisits = `
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
                     LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                     WHERE Property.IsPublic = 1
                     AND Property.ApprovedBy IS NOT NULL
                     GROUP BY Property.ID
                     HAVING COUNT(*) = ?`;

                connection.query(sqlVisits, [search], function(err, result, fields) {
                    console.log(err);
                    console.log(result);
                    response.render('visitorHome', {
                        username: userInfo.Username,
                        rows: result
                    });
                });

            }
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
                     ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
                     FROM Property
                     LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                     WHERE Property.IsPublic = 1
                     AND Property.ApprovedBy IS NOT NULL
                     GROUP BY Property.ID
                     HAVING AVG(Rating) BETWEEN ? AND ?`; // change isPublic to 1 later

                connection.query(sqlAvgRating, [min, max], function(err, result, fields) {
                    console.log(err);
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
                     ) AS Commercial, ID, COUNT( * ) AS Visits, AVG( Rating ) AS 'Avg. Rating'
                     FROM Property
                     LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                     WHERE Property.IsPublic = 1
                     AND Property.ApprovedBy IS NOT NULL
                     GROUP BY Property.ID
                     HAVING AVG(Rating) = ?`;

                connection.query(sqlAvgRating, [search], function(err, result, fields) {
                    console.log(err);
                    console.log(result);
                    response.render('visitorHome', {
                        username: userInfo.Username,
                        rows: result
                    });
                });
            }
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
                 LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                 WHERE Property.IsPublic = 1
                 AND Property.ApprovedBy IS NOT NULL
                 AND ` + col + ` LIKE  ?
                 GROUP BY Property.ID`;

            connection.query(sql2params, ['%' + search + '%'], function(err, result, fields) {
                console.log(err);
                console.log(result);
                response.render('visitorHome', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        }
    }
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
    if (request.body.column != undefined) {
        var col = request.body.column;
        var search = request.body.search;
        // if (col == "Logged Visits") {
        //     col = "LoggedVisits";
        // }
        if (col == "Logged Visits") {
            var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Visit.Username IS NULL THEN 0 ELSE 1 END) as LoggedVisits
            FROM User LEFT JOIN Visit ON Visit.Username = User.Username
            WHERE User.UserType = 'VISITOR'
            GROUP BY Username
            HAVING COUNT(*) = ?`;
            connection.query(sql, [search], function(err, result, fields) {
                // console.log(sql);
                // console.log(result);
                // console.log(err);

                response.render('allVisitorsInSystem', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        } else {
            var sql = `SELECT User.Username, User.Email, SUM(CASE WHEN Visit.Username IS NULL THEN 0 ELSE 1 END) as LoggedVisits
            FROM User LEFT JOIN Visit ON Visit.Username = User.Username
            WHERE User.UserType = 'VISITOR' AND User.`+ col +` LIKE ?
            GROUP BY Username;`;
            connection.query(sql, ['%'+search+'%'], function(err, result, fields) {
                // console.log(sql);
                // console.log(result);
                // console.log(err);

                response.render('allVisitorsInSystem', {
                    username: userInfo.Username,
                    rows: result
                });
            });
        }

    } else if (request.body.deleteLog == "") {
        //deleteLog
        var user = request.body.usernameval;
        var sql = `DELETE FROM Visit WHERE Username = ?`;
        console.log(String(user))
        connection.query(sql, [user], function(err, result, fields) {
            console.log("deleteLog");
            var sql2 = `SELECT User.Username, User.Email, SUM(CASE WHEN Visit.Username IS NULL THEN 0 ELSE 1 END) as LoggedVisits
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
    } else  {
        //deleteAcc
        var user = request.body.usernameval;
        var sql = `DELETE FROM User WHERE Username = ?`;
        connection.query(sql, [user],  function(err, result, fields) {
            console.log("deleteAcc");
            var sql2 = `SELECT User.Username, User.Email, SUM(CASE WHEN Visit.Username IS NULL THEN 0 ELSE 1 END) as LoggedVisits
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
});

app.post('/login', function(request, response) {
    var email = request.body.inputEmail;
    var password = md5(request.body.inputPassword);

    // console.log(request.body);

    var sql = "SELECT * FROM User WHERE Email = ?";
    connection.query(sql, [email], function(err, result, fields) {
        if (err) {
            return;
        };
        // console.log(result[0]);

        if (result[0] == undefined) {
            console.log("Invalid Login");
            response.render('badLogin');
        } else {
            if (result[0].Password === password) {
                console.log("Valid Login from " + email);
                userInfo = result[0];
                signedIn = true;

                if (userInfo.UserType === 'OWNER') {
                    var sql = `SELECT Name, Address, City, Zip, Size,
                              TYPE , Public, Commercial, ID, isValid, Visits, (

                              CASE WHEN tempdata.avgrating >0
                              THEN tempdata.avgrating
                              ELSE  'N/A'
                              END
                              ) AS Rating
                              FROM (

                              SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
                              TYPE , (

                              CASE WHEN IsPublic =1
                              THEN  'True'
                              ELSE  'False'
                              END
                              ) AS Public, (

                              CASE WHEN IsCommercial =1
                              THEN  'True'
                              ELSE  'False'
                              END
                              ) AS Commercial, ID, (

                              CASE WHEN ApprovedBy IS NULL
                              THEN  'False'
                              ELSE  'True'
                              END
                              ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                              FROM Property
                              LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                              WHERE Owner =  ?
                              GROUP BY ID
                              ) AS tempdata`;
                    connection.query(sql, [userInfo.Username], function(err, result, fields) {
                        myPropertyInfo = result;
                        // console.log('my properties');
                        // console.log(result);
                        var sql = `SELECT Name, Address, City, Zip, Size,
                                    TYPE , Public, Commercial, ID, isValid, Visits, (

                                    CASE WHEN tempdata.avgrating >0
                                    THEN tempdata.avgrating
                                    ELSE  'N/A'
                                    END
                                    ) AS Rating
                                    FROM (

                                    SELECT Name, Street AS Address, City, Zip, Size, PropertyType AS
                                    TYPE , (

                                    CASE WHEN IsPublic =1
                                    THEN  'True'
                                    ELSE  'False'
                                    END
                                    ) AS Public, (

                                    CASE WHEN IsCommercial =1
                                    THEN  'True'
                                    ELSE  'False'
                                    END
                                    ) AS Commercial, ID, (

                                    CASE WHEN ApprovedBy IS NULL
                                    THEN  'False'
                                    ELSE  'True'
                                    END
                                    ) AS isValid, COUNT( * ) AS Visits, AVG( RATING ) AS avgrating
                                    FROM Property
                                    LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                                    WHERE Owner !=  ?
                                    GROUP BY ID
                                    ) AS tempdata
                                    `;
                        connection.query(sql, [userInfo.Username],function(err, result, fields) {
                            allPropertyInfo = result;
                            // console.log('everything');
                            // console.log(result);
                            response.render('ownerProperties', {
                                username: userInfo.Username,
                                personalProperty: myPropertyInfo,
                                allProperty: allPropertyInfo
                            });
                        });
                    });
                } else if (userInfo.UserType === 'VISITOR') { // change WHERE Property.IsPublic to 1 for actual results
                    var sql = `
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
                        LEFT JOIN Visit ON Visit.PropertyID = Property.ID
                        WHERE Property.IsPublic = 1
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
