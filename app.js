require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');
const mongoUri = require('./config/db');

// Aumente o limite de corpo da requisição
app.use(bodyParser.json({
    limit: '40mb'
}));

app.use(bodyParser.urlencoded({
    limit: '40mb',
    parameterLimit: 100000,
    extended: true
}));

// Config Cors
const corsOptions = {
    origin: 'https://cad-plantas-brasil.vercel.app'
};

app.use(cors(corsOptions));

// Importando as rotas
const userRoutes = require('./routes/user');
const plantsRoutes = require('./routes/plants');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Usando as rotas
app.use('/api', userRoutes, plantsRoutes);

mongoose
    .connect(mongoUri)
    .then(() => {
        app.listen(3000);
        console.log("Conectou ao banco de dados!");
    }).catch((err) => console.log(err));