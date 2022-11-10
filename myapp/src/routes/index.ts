// default settings
var express = require('express');
var router = express.Router();

// settings which enable POST


/* GET db */
const mysql = require('mysql')
const connection = mysql.createConnection({
  host: 'db', 
  user: 'root', 
  password: 'password', 
  database: 'DockerTask'
})
connection.connect()

interface SpreadsheetData {
  sheet: any, 
  rows: any[]
}

interface Animal {
  id: number, 
  name: string, 
  age: number, 
  salary: number
}

// define functions to manipulate data
async function getDataFromSpreadsheet(): Promise<SpreadsheetData> {
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
      // console.log(`${sql} is executed`)
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

async function updateAnimal(value: Animal) {
  const data = await getDataFromSpreadsheet()
  const animalForEdit = data.rows.find(animal => animal.id === value.id)

  const keys = Object.keys(value) as (keyof Animal)[]
  keys.forEach((key) => {
    animalForEdit[key] = value[key]
  })

  await animalForEdit.save()
}

async function deleteAnimal(id: number) {
  const data = await getDataFromSpreadsheet()
  const animalForDelete = data.rows.find(animal => animal.id === id)
  await animalForDelete.delete()
}

async function createAnimal(value: Animal) {
  const data = await getDataFromSpreadsheet()
  const lastAnimal = data.rows.slice(-1)[0]

  
  const newAnimal: Animal = {
    id: Number(lastAnimal.id)+1, 
    name: value.name, 
    age: value.age, 
    salary: value.salary
  }
  await data.sheet.addRow(newAnimal)
}

// routing
router.get('/', function(req: any, res: any, next: any) {
  getAllDataFromMySQL(connection)
  .then((data: any) => {
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

router.get('/clear', function(req: any, res: any, next: any) {
  deleteAllDataFromSQL(connection)
  .then(()=>{
    res.redirect('/')
  })
})

router.get('/change', function(req: any, res: any, next: any) {
  getDataFromSpreadsheet()
  .then((data: SpreadsheetData) => {
    let animals: Animal[] = [];
    data.rows.forEach((row: any) => { 
      animals.push({id: row.id, name: row.name, age: row.age, salary: row.salary})
    })

    res.render('change', {
      animals: animals
    })
  })
})

router.get('/create', function(req: any, res: any, next: any) {
  res.render('create', {})
})
router.post('/create', function(req: any, res: any, next: any) {
  createAnimal(req.body)
  .then(() => {
    res.redirect('/change')
  })
})

router.get('/delete/:id', function(req: any, res: any, next: any) {
  deleteAnimal(req.params.id)
  .then(() => {
    res.redirect('/change')
  })
})

router.get('/edit/:id', function (req: any, res: any, next: any) {
  getDataFromSpreadsheet()
  .then((data: SpreadsheetData) => {
    let animals: Animal[] = [];
    data.rows.forEach((row: any) => { 
      animals.push({id: row.id, name: row.name, age: row.age, salary: row.salary})
    })

    const animalIdForEdit = req.params.id;
    const animalForEdit = animals.find(animal => animal.id === animalIdForEdit)

    res.render('edit', {
      animal: animalForEdit
    })
  })
})
router.post('/edit/:id', function (req: any, res: any, next: any) {
  updateAnimal(req.body)
  .then(() => {
    res.redirect('/change')
  })
})



module.exports = router;