var mysql = require('mysql');
// var creds = require('credentials.js');
var con = mysql.createConnection({
  host: "academic-mysql.cc.gatech.edu",
  user: "cs4400_team_27",
  password: "FSuJjLjh",
  database: "cs4400_team_27"
});
con.connect();

sql = "INSERT INTO User (Username,Email,Password,UserType) VALUES ('lillian', 'lillianzhang@gatech.edu', 'd68fae04506bde7857ff4aa40ebad49c', 'ADMIN')";
con.query(sql, function (err, result, fields) {
  if (err) throw err;
  console.log(JSON.stringify(result));
});
con.end();
