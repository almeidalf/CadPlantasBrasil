const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ajuste o caminho se necessário

// Rota de Registro (Register User)
router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
        return res.status(422).json({ mensagem: "Todos os campos devem ser obrigatórios" });
    }

    if (password !== confirmPassword) {
        return res.status(404).json({ mensagem: "As senhas não conferem" });
    }

    const userExists = await User.findOne({ email: email });

    if (userExists) {
        return res.status(422).json({ mensagem: "Usuário já cadastrado" });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        password: passwordHash,
    });

    try {
        await user.save();
        res.status(201).json({ mensagem: "Usuário criado com sucesso" });
    } catch (err) {
        res.status(500).json({ mensagem: "Erro ao criar usuário" });
    }
});

// Rota de Login (Login User)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ mensagem: "E-mail e senha devem ser preenchidos" });
    }

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(422).json({ mensagem: "Usuário não encontrado" });
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
        return res.status(404).json({ mensagem: "Senha inválida!" });
    }

    try {
        const secret = process.env.SECRET;
        const token = jwt.sign({
            id: user.id,
        }, secret);

        res.status(200).json({ token: token });
    } catch (err) {
        console.error("Erro ao gerar token:", err);
        res.status(500).json({ mensagem: "Erro ao gerar token" });
    }
});

module.exports = router;