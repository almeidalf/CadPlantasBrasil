require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express()

// Config JSON
app.use(express.json())

// Models
const User = require('./models/User')

// Open Route
app.get('/', (req, res) => {
    res.status(200).json({ mensagem: "Bem vindo a nossa API CADASTRO DE PLANTAS BRASIL"})
});

// Private Route
app.get('/user/:id', checkToken, async(req, res) => {
    const id = req.params.id

    const user = await User.findById(id, '-password')

    if(!user) {
        return res.status(404).json({ mensagem: "Usuário não encontrado"})
    }

    res.status(200).json({ user })
})

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

// Register User
app.post('/auth/register', async(req,res) => {
    const { name, email, password, confirmPassword } = req.body

    if(!name && !email && !password) {
        return res.status(422).json({ mensagem: "Todos campos devem ser obrigatorios" })
    }

    if(password !== confirmPassword) {
        return res.status(404).json({ mensagem: "As senhas não conferem"})
    }

    const userExists = await User.findOne({ email: email})

    if(userExists) {
        return res.status(422).json({ mensagem: "Usuário já cadastrado"})
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)
    
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try {
        await user.save()
        res.status(201).json({ mensagem: "Usuário criado com sucesso"})
    } catch (err) {
        res.status(500).json({ mensagem: "Erro"})
    }

})

// LOGIN USER
app.post('/auth/login', async (req,res) => {
    const { email, password } = req.body

    if(!email && !password) {
        return res.status(422).json({ mensagem: "E-mail e senha devem ser preenchidos" })
    }

    const user = await User.findOne({ email: email})

    if(!user) {
        return res.status(422).json({ mensagem: "Usuário não encontrado"})
    }

    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(404).json({ mensagem: "Senha inválida!" })
    }

    try {
        const secret = process.env.SECRET
        const token = jwt.sign({
            id: user.id,
        },
        secret,
        )

        res.status(200).json({ token: token })
    } catch (err) {
        res.status(500).json({ mensagem: "Erro"})
    }

})

//Credencials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
    .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cadplantasbrasil.ifrzm5h.mongodb.net/?retryWrites=true&w=majority`
    )
    .then(() => {
        app.listen(3000)
        console.log("Conectou ao banco de dados!")
}).catch((err) => console.log(err))
