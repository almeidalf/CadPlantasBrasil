const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const checkToken = require('../middlewares/check-token');
const { processImageAndUploadToFtp } = require('../helpers/imageHelper');
const ExcelJS = require('exceljs');
const Leaf = require('../models/Leaf');
const Stem = require('../models/Stem');
const Inflorescence = require('../models/Inflorescence');
const Fruit = require('../models/Fruit');

router.post('/v1/plants/register', checkToken, processImageAndUploadToFtp, async (req, res) => {
    const { name, nameScientific, description, location } = req.body;
    const userId = req.userId;
    const imageReferences = req.imageReferences;

    if (!name || !description || !location) {
        return res.status(422).json({ message: "Todos os campos obrigatórios (name, description, location) devem ser preenchidos" });
    }

    if (typeof location.latitude !== 'string' || typeof location.longitude !== 'string') {
        return res.status(422).json({ message: "Latitude e Longitude devem ser string" });
    }

    try {
        const plant = new Plant({
            subscriber: userId,
            name,
            nameScientific,
            description,
            location,
            images: imageReferences,
        });

        await plant.save();
        res.status(201).json({ message: "Planta cadastrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao cadastrar planta:", err);
        res.status(500).json({ message: "Erro ao cadastrar planta", error: err.message });
    }
});

router.get('/v1/plants/list', checkToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const plants = await Plant.find(
            { subscriber: userId },
            'name nameScientific description location images createdAt'
        );

        res.status(200).json(plants);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar plantas', error: err.message });
    }
});

router.get('/v1/plants/findId/:id', checkToken, async (req, res) => {
    try{
        const id = req.params.id;
        const plant = await Plant.findById(id, '-updatedAt');
        if (!plant) {
            return res.status(404).json({ message: "Planta não encontrada" });
        }
        res.status(200).json(plant);
    }catch(err){
        res.status(500).json({ message: 'Erro ao buscar planta', error: err.message });
    }
});

router.get('/v1/plants/findName/:name', checkToken, async (req, res) => {
    try {
        const name = req.params.name;

        const plants = await Plant.find({ name: { $regex: `^${name}`, $options: 'i' } }, '-updatedAt');

        if (!plants || plants.length === 0) {
            return res.status(404).json({ message: 'Nenhuma planta encontrada com esse nome' });
        }

        res.status(200).json(plants);
    } catch (err) {
        console.error("Erro ao buscar plantas:", err);
        res.status(500).json({ message: 'Erro ao buscar plantas', error: err.message });
    }
});

router.get('/v1/plants/export/excel', checkToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const plants = await Plant.find(
            { subscriber: userId },
            'name nameScientific description location createdAt'
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantas');

        worksheet.columns = [
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Nome Científico', key: 'nameScientific', width: 30 },
            { header: 'Descrição', key: 'description', width: 40 },
            { header: 'Latitude', key: 'latitude', width: 20 },
            { header: 'Longitude', key: 'longitude', width: 20 },
            { header: 'Data de Cadastro', key: 'createdAt', width: 25 },
        ];

        plants.forEach(plant => {
            worksheet.addRow({
                name: plant.name,
                nameScientific: plant.nameScientific || '',
                description: plant.description,
                latitude: plant.location.latitude,
                longitude: plant.location.longitude,
                createdAt: plant.createdAt.toLocaleString(),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=plantas.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        console.error('Erro ao gerar Excel:', err);
        res.status(500).json({ message: 'Erro ao gerar Excel', error: err.message });
    }
});

router.get('/v1/plants/parts', checkToken, async (req, res) => {
    try {
        const [leaves, stem, inflorescence, fruit] = await Promise.all([
            Leaf.find(),
            Stem.find(),
            Inflorescence.find(),
            Fruit.find()
        ]);

        res.status(200).json({
            leaves: leaves.map(item => item.type),
            stem: stem.map(item => item.type),
            inflorescence: inflorescence.map(item => item.type),
            fruit: fruit.map(item => item.type)
        });
    } catch (err) {
        console.error("Erro ao buscar partes das plantas:", err);
        res.status(500).json({ message: "Erro ao buscar partes das plantas", error: err.message });
    }
});

module.exports = router;