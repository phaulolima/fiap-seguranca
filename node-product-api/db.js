const { randomUUID } = require('crypto');

async function connect(){
    if(global.connection && global.connection.state !== 'disconnected')
        return global.connection;
 
    const mysql = require("mysql2/promise");
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: 3306,
        user: 'test',
        password: 'test',
        database: 'finalProjectSubst',
        multipleStatements: true
      } );
    console.log("Conectou no MySQL!");
    global.connection = connection;
    return connection;
}

async function getAllProducts(){
    const conn = await connect();
    
    const query = `SELECT * FROM products LIMIT 1000;`;
    console.log(`Executando query: ${query}`);

    const [rows, fields] = await connection.execute(query);
    console.log(`Rows: ${JSON.stringify(rows)}`);
    return rows;
}

/* 3 - UTILIZAR PREPARED STATEMENTS AO INVÉS DE CONCATENAÇÃO DE QUERY */

async function getProductById(id){
    const conn = await connect();
    
    const query = `SELECT * FROM products WHERE id = ?;`;
    console.log(`Executando query usando "Prepared Statements": ${query}`);
    
    try {
        const [rows, fields] = await connection.query(query, [id]);
        console.log("Retorno do SQL: " + JSON.stringify(rows));
        return rows;
    } catch (error) {
        console.log("Erro SQL: " + err);
        throw'Erro Inesperado';
    }
}


async function updateProductById(id, name, description, value){
    try{
        const conn = await connect();

        const query = `UPDATE products SET name = ?, description = ?, value = ? WHERE id = ?;`;
        console.log(`Executando query: ${query}`);
        console.log(`Executando query usando "Prepared Statements": ${query}`);
        
        const [rows] = await conn.query(query, [name, description, value, id]);
        return rows;
    }catch(err){
        throw {code: 500, message: 'Erro inesperado ao tentar cadastrar um produto'};
    }
}

async function deleteProductById(id){
    const conn = await connect();
    
    const query = `DELETE FROM products WHERE id = ?;`;
    console.log(`Executando query: ${query}`);
    console.log(`Executando query usando "Prepared Statements": ${query}`);

    await connection.query(query, [id])
}

async function insertProduct(name, description, value){
    const conn = await connect();

    const query = `INSERT INTO products(id, name, description, value) VALUES ("${randomUUID()}", "?", "?", "?");`;
    console.log(`Executando query: ${query}`);
    console.log(`Executando query usando "Prepared Statements": ${query}`);

    try{
        await connection.query(query, [name, description, value]);
    }catch(err){
        if(err.errno === 1062){
            throw {code: 400, message: 'Já existe um producte cadastrado com este usuário!'};
        }else{
            throw {code: 500, message: 'Erro inesperado ao tentar cadastrar produto'};
        }
    }
}

module.exports = {getProductById, getAllProducts, insertProduct, updateProductById, deleteProductById}
