const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const checkToken = require('../middlewares/check-token');

router.post('/v1/groups/create', checkToken, async (req, res) => {
    const { name, description } = req.body;
    const subscriber = req.userId;

    if (!name) {
        return res.status(400).json({ message: 'Nome do grupo é obrigatório.' });
    }

    try {
        const existingGroup = await Group.findOne({ name, subscriber });

        if (existingGroup) {
            return res.status(409).json({ message: 'Já existe um grupo com esse nome.' });
        }

        const group = new Group({
            subscriber,
            name,
            description
        });

        await group.save();

        res.status(201).json({
            message: 'Grupo criado com sucesso!',
            group
        });

    } catch (err) {
        console.error('Erro ao criar grupo:', err);
        res.status(500).json({ message: 'Erro ao criar grupo.', error: err.message });
    }
});

router.get('/v1/groups/list', checkToken, async (req, res) => {
    try {
        const subscriber = req.userId;
        const groups = await Group.find({ subscriber }).sort({ createdAt: -1 });

        res.status(200).json(groups);
    } catch (err) {
        console.error('Erro ao listar grupos:', err);
        res.status(500).json({ message: 'Erro ao listar grupos.', error: err.message });
    }
});

router.get('/v1/groups/:id', checkToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        if (group.subscriber.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado a este grupo.' });
        }

        res.status(200).json(group);
    } catch (err) {
        console.error('Erro ao buscar grupo:', err);
        res.status(500).json({ message: 'Erro ao buscar grupo.', error: err.message });
    }
});

router.put('/v1/groups/:id', checkToken, async (req, res) => {
    const { name, description } = req.body;

    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        if (group.subscriber.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado a este grupo.' });
        }

        group.name = name || group.name;
        group.description = description || group.description;

        await group.save();
        res.status(200).json({ message: 'Grupo atualizado com sucesso.', group });
    } catch (err) {
        console.error('Erro ao atualizar grupo:', err);
        res.status(500).json({ message: 'Erro ao atualizar grupo.', error: err.message });
    }
});

router.delete('/v1/groups/:id', checkToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        if (group.subscriber.toString() !== req.userId) {
            return res.status(403).json({ message: 'Acesso negado a este grupo.' });
        }

        await group.deleteOne();
        res.status(200).json({ message: 'Grupo deletado com sucesso.' });
    } catch (err) {
        console.error('Erro ao deletar grupo:', err);
        res.status(500).json({ message: 'Erro ao deletar grupo.', error: err.message });
    }
});

module.exports = router;