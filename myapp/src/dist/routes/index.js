"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// default settings
var express = require('express');
var router = express.Router();
// settings which enable POST
/* GET db */
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'db',
    user: 'root',
    password: 'password',
    database: 'DockerTask'
});
connection.connect();
// define functions to manipulate data
function getDataFromSpreadsheet() {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        require('dotenv').config();
        const { GoogleSpreadsheet } = require('google-spreadsheet');
        const doc = new GoogleSpreadsheet(process.env.SHEET_ID);
        yield doc.useServiceAccountAuth({
            client_email: (_a = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) !== null && _a !== void 0 ? _a : '',
            private_key: ((_b = process.env.GOOGLE_PRIVATE_KEY) !== null && _b !== void 0 ? _b : '').replace(/\\n/g, '\n'),
        });
        yield doc.loadInfo(); // loads document properties and worksheets
        const sheet = doc.sheetsByIndex[0];
        const rows = yield sheet.getRows();
        return {
            sheet: sheet,
            rows: rows
        };
    });
}
function insertIntoDatabaseFromSpreadsheet(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getDataFromSpreadsheet();
        data.rows.forEach((row) => {
            let sql = `INSERT INTO animals (name, age, salary) VALUES ("${row.name}", ${row.age}, ${row.salary});`;
            connection.query(sql, (err, results, fields) => {
                if (err)
                    throw err;
                // console.log(`${sql} is executed`)
            });
        });
    });
}
function deleteAllDataFromSQL(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const removeSQL = 'TRUNCATE animals;';
        connection.query(removeSQL, (err, results, fields) => {
            if (err)
                throw err;
            console.log('all data removed');
        });
    });
}
function getAllDataFromMySQL(connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const selectSQL = 'SELECT * FROM animals;';
        return yield new Promise((resolve, reject) => {
            connection.query(selectSQL, (error, results, fields) => {
                resolve({
                    results
                });
            });
        });
    });
}
function updateAnimal(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getDataFromSpreadsheet();
        const animalForEdit = data.rows.find(animal => animal.id === value.id);
        const keys = Object.keys(value);
        keys.forEach((key) => {
            animalForEdit[key] = value[key];
        });
        yield animalForEdit.save();
    });
}
function deleteAnimal(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getDataFromSpreadsheet();
        const animalForDelete = data.rows.find(animal => animal.id === id);
        yield animalForDelete.delete();
    });
}
function createAnimal(value) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getDataFromSpreadsheet();
        const lastAnimal = data.rows.slice(-1)[0];
        const newAnimal = {
            id: Number(lastAnimal.id) + 1,
            name: value.name,
            age: value.age,
            salary: value.salary
        };
        yield data.sheet.addRow(newAnimal);
    });
}
// routing
router.get('/', function (req, res, next) {
    getAllDataFromMySQL(connection)
        .then((data) => {
        res.render('index', {
            title: 'DockerTask',
            animals: data.results
        });
    });
});
router.get('/add', function (req, res, next) {
    insertIntoDatabaseFromSpreadsheet(connection)
        .then(() => {
        res.redirect('/');
    });
});
router.get('/clear', function (req, res, next) {
    deleteAllDataFromSQL(connection)
        .then(() => {
        res.redirect('/');
    });
});
router.get('/change', function (req, res, next) {
    getDataFromSpreadsheet()
        .then((data) => {
        let animals = [];
        data.rows.forEach((row) => {
            animals.push({ id: row.id, name: row.name, age: row.age, salary: row.salary });
        });
        res.render('change', {
            animals: animals
        });
    });
});
router.get('/create', function (req, res, next) {
    res.render('create', {});
});
router.post('/create', function (req, res, next) {
    createAnimal(req.body)
        .then(() => {
        res.redirect('/change');
    });
});
router.get('/delete/:id', function (req, res, next) {
    deleteAnimal(req.params.id)
        .then(() => {
        res.redirect('/change');
    });
});
router.get('/edit/:id', function (req, res, next) {
    getDataFromSpreadsheet()
        .then((data) => {
        let animals = [];
        data.rows.forEach((row) => {
            animals.push({ id: row.id, name: row.name, age: row.age, salary: row.salary });
        });
        const animalIdForEdit = req.params.id;
        const animalForEdit = animals.find(animal => animal.id === animalIdForEdit);
        res.render('edit', {
            animal: animalForEdit
        });
    });
});
router.post('/edit/:id', function (req, res, next) {
    updateAnimal(req.body)
        .then(() => {
        res.redirect('/change');
    });
});
module.exports = router;
