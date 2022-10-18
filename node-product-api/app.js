// var http = require('http'); 

const express = require('express') 
const app = express();
const port = 3001;
const fs   = require('fs');


var RateLimit = require('express-rate-limit');

/* Mitigar Brute Force/Dictionary Attack através da implementação de RateLimit na API */
var limiter = new RateLimit({
    windowMs: 15*60*1000, 
    max: 50, 
    delayMs: 0, 
    message: "Muitas requisições criadas a partir deste IP, tente novamente após uma hora!"
  });

app.use(limiter);

var https = require('https');
var privateKey  = fs.readFileSync('./sslcert/selfsigned.key', 'utf8');
var certificate = fs.readFileSync('./sslcert/selfsigned.crt', 'utf8');

var credentials = {key: privateKey, cert: certificate};

var httpsServer = https.createServer(credentials, app);

const db = require("./db");

var cookieParser = require('cookie-parser'); 
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true })); 
app.use(bodyParser.json());
app.use(cookieParser()); 

const { auth, requiredScopes} = require('express-oauth2-jwt-bearer');
const checkScopes = requiredScopes('openid');

const checkJwt = auth({
    audience: 'http://localhost:4200',
    issuerBaseURL: `https://dev-y3a-i11v.us.auth0.com`,
});

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});


app.get('/products', checkJwt, checkScopes, async (req, res, next) => { 
    var resp = await db.getAllProducts();
    res.status(200).json(resp);
});

app.post('/products', async (req, res, next) => { 

    try{
        var name = req.body.name;
        var description = req.body.description
        var value = req.body.value
        
        await db.insertProduct(name, description, value);
        return res.status(200).json({message: 'Produto cadastrado com sucesso!'});

    }catch(err){
        return res.status(err.code).json(err);
    }
});


app.get('/products/:id', checkJwt, checkScopes, async (req, res, next) => { 

    try{
        console.log(req.params.id.length);
        console.log(req.params.id);

        if(!req.params.id || req.params.id.length < 36){
            return res.status(400).json({error: "Id do produto não informado ou tamanho inválido.", message: "Deve conter ao menos 36 caracteres entre letras e números"});
        }
        /* VALIDAÇÃO DE CAMPOS DE ENTRADA PARA EVITAR SQL INJECTION */
        if(req.params.id.match(/('(''|[^'])*')|(\)\;)|(--)|(ALTER|CREATE|DELETE|DROP|EXEC(UTE){0,1}|INSERT( +INTO){0,1}|MERGE|SELECT|UPDATE|VERSION|ORDER|UNION( +ALL){0,1})/)){
            return res.status(400).json({error: "Id do produto inválido!", message: "Id contém caracter ou palavra inválida"});
        }

        var id = req.params.id;
        const [rows] = await db.getProductById(id);
        if(rows){
            return res.status(200).send(rows);
        }
        return res.status(404).send(`Produto ${id} não encontrado!`);
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.put('/products/:id', async (req, res, next) => { 

    try{
        var id = req.params.id;

        var name = req.body.name;
        var description = req.body.description
        var value = req.body.value
        
        const rows = await db.updateProductById(id, name, description, value);
        if(rows){
            return res.status(200).send({message: "Produto atualizado com sucesso!"});
        }
        return res.status(404).send(`Produto ${id} atualizado com sucesso!`);
    }catch(err){
        return res.status(err.code).json(err);
    }
});

app.delete('/products/:id', async (req, res, next) => {

    try{
        var id = req.params.id;
        await db.deleteProductById(id);
        return res.status(200).send({message: `Produto ${id} deletado com sucesso!`}); 

    }catch(err){
        return res.status(err.code).json(err);
    }
});


httpsServer.listen(port, () => {
    console.log(`Listening at https://localhost:${port}`)
});
