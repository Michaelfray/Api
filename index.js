const express = require("express");
const mysql = require("mysql");

const app = express();
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servern körs på port ${PORT}`);
});

app.use(express.json()); // för att läsa data från klient och för att skicka svar (ersätter bodyparser som vi använt någon gång tidigare)

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "jensen2023",
  multipleStatements: true,
});

const COLUMNS = ["id", "username", "password", "name", "email"]; // ÄNDRA TILL NAMN PÅ KOLUMNER I ER EGEN TABELL

// Serve your documentation
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/dokumentation.html");
});
app.post("/users", (req, res) => {
  // kod för att validera input
  if (!req.body.username) {
    res.status(400).send("username required!");
    return; // avslutar metoden
  }
  let fields = ["username", "password", "name", "email"]; // ändra eventuellt till namn på er egen databastabells kolumner
  for (let key in req.body) {
    if (!fields.includes(key)) {
      res.status(400).send("Unknown field: " + key);
      return; // avslutar metoden
    }
  }
  // kod för att hantera anrop
  let sql = `INSERT INTO users (username, password, name, email)
      VALUES ('${req.body.username}', 
      '${req.body.password}',
      '${req.body.name}',
      '${req.body.email}');
      SELECT LAST_INSERT_ID();`; // OBS: innehåller två query: ett insert och ett select
  console.log(sql);

  con.query(sql, (err, result, fields) => {
    if (err) throw err;
    // kod för att hantera retur av data
    console.log(result);
    let output = {
      id: result[1][0].id,
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      email: req.body.email,
    };
    res.send(output);
  });
});

// Get all users or filter based on query parameters
app.get("/users", (req, res) => {
  let sql = "SELECT * FROM users";
  let condition = createCondition(req.query);
  console.log(sql + condition);

  con.query(sql + condition, (err, result, fields) => {
    res.send(result);
  });
});

// route-parameter, dvs. filtrera efter ID i URL:en
app.get("/users/:id", (req, res) => {
  // Värdet på id ligger i req.params
  let sql = "SELECT * FROM users WHERE id=" + req.params.id;
  console.log(sql);
  // skicka query till databasen
  con.query(sql, (err, result, fields) => {
    if (result.length > 0) {
      res.send(result);
    } else {
      res.sendStatus(404); // 404=not found
    }
  });
});

// Add a new user

function createCondition(query) {
  let output = " WHERE ";
  for (let key in query) {
    if (COLUMNS.includes(key)) {
      output += `${key}="${query[key]}" OR `;
    }
  }
  if (output.length == 7) {
    return "";
  } else {
    return output.substring(0, output.length - 4); // ta bort sista " OR "
  }
}