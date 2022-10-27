var express = require('express');
var router = express.Router();

/* GET db */
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'db', 
  user: 'root', 
  password: 'password', 
  database: 'DockerTask'
})
connection.connect()

async function getDataFromSpreadsheet() {
  require('dotenv').config();
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '',
    private_key: (process.env.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  });
  await doc.loadInfo(); // loads document properties and worksheets
  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  return {
    sheet: sheet, 
    rows: rows
  }
}

async function insertIntoDatabaseFromSpreadsheet(connection: any) {

  getDataFromSpreadsheet()
  .then((data: any) => {
    data.rows.forEach((row: any) => {
      let sql = `INSERT INTO animals (name, age, salary) VALUES ("${row.name}", ${row.age}, ${row.salary});`
      connection.query(sql, (err: any, results: any, fields: any) => {
        if (err) throw err;
        console.log(`${sql} is executed`)
      })
    })
  }
  )
}

router.get('/', function(req: any, res: any, next: any) {

  const selectSQL = 'SELECT * FROM animals;'

  // insertIntoDatabaseFromSpreadsheet(connection);
  
  connection.query(selectSQL, (err: any, results: any, fields: any) => {
    if (err) throw err;
    console.log(results)
  });
  
  res.render('index', {
    title: 'DockerTask', 
  })
})

module.exports = router;