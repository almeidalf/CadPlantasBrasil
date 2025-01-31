require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Config JSON
app.use(express.json());

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
        `mongodb+srv://${dbUser}:${dbPassword}@cadplantasbrasil.cna64.mongodb.net/?retryWrites=true&w=majority&appName=CadPlantasBrasil`
    )
    .then(() => {
        app.listen(port);
        console.log("Conectou ao banco de dados!");
    }).catch((err) => console.log(err));