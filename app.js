require('dotenv').config();
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Config JSON
app.use(express.json());

// Aumente o limite de corpo da requisição
app.use(express.json({ limit: '50mb' }));  // Configura o limite de JSON para 50MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));  // Configura o limite para dados codificados em URL
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));



// Config Cors
const corsOptions = {
    origin: 'https://cad-plantas-brasil.vercel.app'
};

app.use(cors(corsOptions));

// Importando as rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const plantsRoutes = require('./routes/plants');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Usando as rotas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/plants', plantsRoutes);


// Credencials
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;
const port = process.env.PORT || 3000;

mongoose
    .connect(
        `mongodb://${dbUser}:${dbPassword}@82.29.56.19:27017/CadPlantasBrasilDB`
    )
    .then(() => {
        app.listen(port);
        console.log("Conectou ao banco de dados!");
    }).catch((err) => console.log(err));