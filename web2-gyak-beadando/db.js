const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',       
    database: 'forma1',  
});

connection.connect((err) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('Sikeresen csatlakoztunk az adatbázishoz!');
});



module.exports = connection;