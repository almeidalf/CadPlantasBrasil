const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const checkToken = require('../middlewares/check-token');
const { upload } = require('../helpers/imageHelper');
const { uploadToFtp } = require('../helpers/ftpHelper');

router.post('/register', checkToken, upload.array('images', 10), async (req, res) => {
    const { name, nameScientific, description, location } = req.body;
    const userId = req.userId;
    const images = req.files;

    if (!name || !description || !location || !images || !location.latitude || !location.longitude) {
        return res.status(422).json({ message: "Todos os campos obrigatórios (name, description, location, images e latitude/longitude) devem ser preenchidos" });
    }

    if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        return res.status(422).json({ message: "Latitude e Longitude devem ser números" });
    }

    const plantExists = await Plant.findOne({ name: name, nameScientific: nameScientific });
    if (plantExists) {
        return res.status(422).json({ message: "Planta já cadastrada no sistema!" });
    }

    try {
        const imageReferences = await uploadToFtp(images);

        const plant = new Plant({
            subscriber: userId,
            name,
            nameScientific,
            description,
            location,
            images: imageReferences
        });

        await plant.save();
        res.status(201).json({ message: "Planta cadastrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao cadastrar planta:", err);
        res.status(500).json({ message: "Erro ao cadastrar planta", error: err.message });
    }
});

router.get('/list', checkToken, async (req, res) => {
    try {
        const plants = await Plant.find({}, 'name nameScientific description location images createdAt');
        res.status(200).json(plants);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar planta', error: err.message });
    }
});

router.get('/findId/:id', checkToken, async (req, res) => {
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

router.get('/findName/:name', checkToken, async (req, res) => {
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

module.exports = router;