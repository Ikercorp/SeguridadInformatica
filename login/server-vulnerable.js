
// npm init -v
// npm install express sqlite3
// node server-vulnerable.js

const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(":memory:");


db.serialize(() => {
  db.run(
    "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)",
  );
  db.run("INSERT INTO users (username, password) VALUES ('admin', 'admin')");
  db.run("INSERT INTO users (username, password) VALUES ('juan', '1234')");
});


app.post("/login-vulnerable", (req, res) => {
  const { username, password } = req.body;

  // Consulta parametrizada: los placeholders "?" aseguran que username y
  // password siempre se traten como VALORES de datos, nunca como parte
  // del texto SQL. El motor (sqlite3) los sustituye de forma segura,
  // por lo que comillas, "--", "OR 1=1", etc. dejan de tener efecto
  // sobre la estructura de la consulta.
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";

  console.log("Query ejecutada:", query, "| Parametros:", [username, password]);

  db.get(query, [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) return res.json({ ok: true, user: row.username });
    res.status(401).json({ ok: false, message: "Credenciales inválidas" });
  });
});

app.listen(3000, () => console.log("http://localhost:3000"));
