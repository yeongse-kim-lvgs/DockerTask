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


// define functions to manipulate data
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
  const data = await getDataFromSpreadsheet()
  data.rows.forEach((row: any) => {
    let sql = `INSERT INTO animals (name, age, salary) VALUES ("${row.name}", ${row.age}, ${row.salary});`
    connection.query(sql, (err: any, results: any, fields: any) => {
      if (err) throw err;
      console.log(`${sql} is executed`)
    })
  })
}

async function deleteAllDataFromSQL(connection: any) {
  const removeSQL = 'TRUNCATE animals;'
    connection.query(removeSQL, (err: any, results: any, fields: any) => {
      if (err) throw err;
      console.log('all data removed')
  }) 
}

async function getAllDataFromMySQL(connection: any) {
  const selectSQL = 'SELECT * FROM animals;'
  return await new Promise((resolve, reject) => {
    connection.query(selectSQL, (error: any, results: any, fields: any) => {
      resolve({
        results
      });
    });
  })
}


// routing
router.get('/', function(req: any, res: any, next: any) {
  getAllDataFromMySQL(connection)
  .then((data: any) => {
    console.log(data.results)
    res.render('index', {
      title: 'DockerTask', 
      animals: data.results
    })
  })
})

router.get('/add', function(req: any, res: any, next: any) {
  insertIntoDatabaseFromSpreadsheet(connection)
  .then(()=>{
    res.redirect('/')
  })
})

router.get('/delete', function(req: any, res: any, next: any) {
  deleteAllDataFromSQL(connection)
  .then(()=>{
    res.redirect('/')
  })
})

module.exports = router;