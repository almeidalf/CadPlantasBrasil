require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

// Config JSON
app.use(express.json());

// Importando as rotas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const plantsRoutes = require('./routes/plants');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Usando as rotas
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/plants', plantsRoutes);


// Middleware de verificação de token (precisa ser configurado)
function checkToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if(!token) {
        res.status(401).json({ mensagem: "Acesso negado!"})
    }

    try {
        const secret = process.env.SECRET
        jwt.verify(token, secret)
        next()
    } catch (err) {
        res.status(400).json({ mensagem: "Token inválido!"})
    }
}


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