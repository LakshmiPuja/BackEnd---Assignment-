const express = require("express");
const mysql = require("mysql2");

// Create a MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '/Puja#29',
  database: 'financialdatadb'
});

// Connect to MySQL
db.connect(err => {
  if (err) {
    console.error("Error connecting to MySQL Database: ", err);
    return;
  }
  console.log("Connected to MySQL Database");
});

// Create Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// First API Endpoint: /api/?ticker=AAPL
app.get("/Api/ticker/", async (req, res) => {
  const { ticker } = req.query;

  if (!ticker) {
    res.status(400).send("Ticker parameter is required.");
    return;
  }
  
  if (ticker !== "AAPL") {
    res.status(400).send("Invalid ticker value.");
    return;
  }

  const query = `
    SELECT ticker,
    DATE(date) AS date,
    revenue,
    gp,
    fcf,
    capex 
    FROM company_financial 
    WHERE ticker='${ticker}';
  `;

  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send("Error retrieving data from database.");
      return;
    }
    res.send(results);
  });
});

/* Second API Endpoint: Api/?ticker=AAPL&column=revenue,gp
 Third API EndPoint: Api/?ticker=AAPL&column=revenue,gp&period=5Y
 Fourth API ENDPoint: Api/?ticker=YELP&column=revenu,gp&period=5Y
                                        //(or)
                      Api/?ticker=ZS&column=revenue,gp&period=5Y

*/
app.get("/Api/" ,async (req, res) => {
  const { ticker, column, period } = req.query;

  if (!ticker) {
    res.status(400).send("Ticker parameter is required.");
    return;
  }

  if (!column) {
    res.status(400).send("Column parameter is required.");
    return;
  }
  if (period && period !== "5Y") {
    res.status(400).send("Invalid period value. Only '5Y' is supported.");
    return;
  }

  const currentDate = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(currentDate.getFullYear() - 5);

  const formattedCurrentDate = currentDate.toISOString().split('T')[0];
  const formattedFiveYearsAgo = fiveYearsAgo.toISOString().split('T')[0];

  const selectedColumns = column.split(",").map(col => col.trim());
  const columnNames = selectedColumns.join(",");

  let columnQuery = `
    SELECT ticker, date, ${columnNames}
    FROM company_financial
    WHERE ticker='${ticker}';
  `;

  if (period === "5Y") {
    columnQuery = `
      SELECT ticker, date, ${columnNames}
      FROM company_financial
      WHERE ticker='${ticker}' AND date BETWEEN '${formattedFiveYearsAgo}' AND '${formattedCurrentDate}';
    `;
  }

  try {
    const [rows] = await db.promise().query(columnQuery);
    res.send(rows);
  } catch (err) {
    console.error("Error executing query: ", err);
    res.status(500).send("Internal Server Error");
  }
});


// Starting server
app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000`);
});

module.exports = app;
