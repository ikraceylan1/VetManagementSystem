const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Marmara.2026', 
    server: 'localhost', 
    database: 'VetKlinikDB',
    options: {
        instanceName: 'SQLEXPRESS', 
        encrypt: false,
        trustServerCertificate: true
    }
   
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('🔥 İŞTE BU! MS SQL BAĞLANTISI BAŞARILI!');
        return pool;
    })
    .catch(err => {
        console.log('❌ Bağlantı hatası: ', err.message);
    });

module.exports = { sql, poolPromise };