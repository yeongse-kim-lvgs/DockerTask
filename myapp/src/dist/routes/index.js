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
var express = require('express');
var router = express.Router();
/* GET db */
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'db',
    user: 'root',
    password: 'password',
    database: 'DockerTask'
});
connection.connect();
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
        getDataFromSpreadsheet()
            .then((data) => {
            data.rows.forEach((row) => {
                let sql = `INSERT INTO animals (name, age, salary) VALUES ("${row.name}", ${row.age}, ${row.salary});`;
                connection.query(sql, (err, results, fields) => {
                    if (err)
                        throw err;
                    console.log(`${sql} is executed`);
                });
            });
        });
    });
}
router.get('/', function (req, res, next) {
    const selectSQL = 'SELECT * FROM animals;';
    // insertIntoDatabaseFromSpreadsheet(connection);
    connection.query(selectSQL, (err, results, fields) => {
        if (err)
            throw err;
        console.log(results);
    });
    res.render('index', {
        title: 'DockerTask',
    });
});
module.exports = router;
