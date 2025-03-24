const checkToken = require('../middlewares/check-token');
const bcrypt = require('bcrypt');
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const version = 'v1/user';

router.post(`/${version}/register`, async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
        return res.status(422).json({ mensagem: "Todos os campos são obrigatórios" });
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

        const payload = {
            id: user.id,
            email: user.email
        };

        const secret = process.env.SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: '30d' });

        res.status(201).json({
            mensagem: "Usuário criado com sucesso",
            token: token,
        });

    } catch (err) {
        console.error("Erro ao cadastrar usuário:", err);
        res.status(500).json({ mensagem: "Erro ao criar usuário" });
    }
});

router.post('/${version}/login', async (req, res) => {
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

    const payload = {
        id: user.id,
        email: user.email
    };

    try {
        const secret = process.env.SECRET;
        const token = jwt.sign(payload, secret, { expiresIn: '30d' });

        res.status(200).json({ token: token });
    } catch (err) {
        console.log(err)
        res.status(500).json({ mensagem: "Erro ao gerar token" });
    }
});

router.get('${version}/list', checkToken, async (req, res) => {
    try {
        const users = await User.find({}, 'name email createdAt');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar usuários', error: err.message });
    }
});

router.get('${version}/:id', checkToken, async (req, res) => {
    try{
        const id = req.params.id;
        const user = await User.findById(id, '-password -updatedAt');
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }
        res.status(200).json(user);
    } catch(err){
        res.status(500).json({ message: 'Erro ao buscar usuário', error: err.message });
    }
});

module.exports = router;