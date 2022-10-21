"use strict";
var express = require('express');
var router = express.Router();
/* GET home page. */
const mysql = require('mysql');
const connection = mysql.createConnection({
    host: 'db',
    user: 'root',
    password: 'password',
    database: 'DockerTask'
});
router.get('/', function (req, res, next) {
    connection.connect(function (err) {
        if (err)
            throw err;
        console.log('Connected');
    });
    const sql = 'SELECT * FROM animals';
    connection.query(sql, (err, results, fields) => {
        if (err)
            throw err;
        res.render('index', { title: results[2].name });
    });
    // res.render('index', { title: 'My First Application' });
});
module.exports = router;
