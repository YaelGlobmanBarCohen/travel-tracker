import dotenv from 'dotenv';
dotenv.config();
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

db.connect();

async function getVisitedCountries(){
  const result = await db.query(
    "SELECT * FROM visited_countries JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  return result.rows;
}

let currentUserId = 1;
async function getUsers(){
  const result = await db.query("SELECT * FROM users");
  return result.rows;
}

async function getCurrentUser() {
  let users = await getUsers();
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  let countries = await getVisitedCountries();
  let count_countries = countries.length;
  let country_codes = [];
  countries.forEach(element => {
    country_codes.push(element.country_code);
  });
  console.log("the country codes are: " + country_codes);

  let users = await getUsers();
  console.log("the users are: " + users);
  let currentUser = await getCurrentUser();
  let color = currentUser.color;
  // users.forEach(function(user){
  //   console.log("user name is: " + user.name);
  //   console.log("user color is: " + user.color);
  // });
  res.render("index.ejs", {
    total: count_countries,
    countries: country_codes,
    users: users,
    color: color
  });
});

app.post("/add", async (req, res) => {
  let country = capitalizeFirstLetter(req.body.country);
  console.log("the new country is: " + country);
  try{
    const result = await db.query("select country_code from countries where country_name like '%' || $1 || '%';", [country]);
    console.log(result);

  if(result.rows.length !== 0){
    let country_code = result.rows[0].country_code;
    try{
    await db.query("insert into visited_countries (country_code, user_id) values ($1, $2)", [country_code, currentUserId]);
    } catch(err){
      console.log(err);
    }
    res.redirect("/");
  } else{
    res.render("index.ejs", {
      total: count_countries,
      countries: country_codes
    });
  }
  } catch(err){
      console,log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

  // Convert the country or name to be as in the db
  function capitalizeFirstLetter(inputString) {
    if (!inputString) {
      return inputString;
    }
  
    const capitalizedString =
      inputString.charAt(0).toUpperCase() + inputString.slice(1).toLowerCase();
      capitalizedString.trim();
    return capitalizedString;
  }  

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
