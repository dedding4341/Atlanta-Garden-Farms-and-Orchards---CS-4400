var mysql = require('mysql');
// var creds = require('credentials.js');
var con = mysql.createConnection({
  host: "academic-mysql.cc.gatech.edu",
  user: "cs4400_team_27",
  password: "FSuJjLjh"
});
sql = "SELECT * FROM User";
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
});
