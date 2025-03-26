const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const checkToken = require('../middlewares/check-token');
const { processImageAndUploadToFtp } = require('../helpers/imageHelper');

const version = 'v1/plants';

router.post('/' + version + '/register', checkToken, processImageAndUploadToFtp, async (req, res) => {
    const { name, nameScientific, description, location } = req.body;
    const userId = req.userId;
    const imageReferences = req.imageReferences; // Referências das imagens que foram enviadas para o FTP

    // Verificando se todos os campos obrigatórios estão presentes
    if (!name || !description || !location) {
        return res.status(422).json({ message: "Todos os campos obrigatórios (name, description, location) devem ser preenchidos" });
    }

    // Verificando se latitude e longitude são números
    if (typeof location.latitude !== 'string' || typeof location.longitude !== 'string') {
        return res.status(422).json({ message: "Latitude e Longitude devem ser string" });
    }

    try {
        // Criando o objeto da planta com as referências das imagens
        const plant = new Plant({
            subscriber: userId,
            name,
            nameScientific,
            description,
            location,
            images: imageReferences, // Referências das imagens processadas e enviadas para o FTP
        });

        // Salvando no banco de dados
        await plant.save();

        // Respondendo com sucesso
        res.status(201).json({ message: "Planta cadastrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao cadastrar planta:", err);
        res.status(500).json({ message: "Erro ao cadastrar planta", error: err.message });
    }
});

router.get('/' + version + '/list', checkToken, async (req, res) => {
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

router.get('/' + version + '/findId/:id', checkToken, async (req, res) => {
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

router.get('/' + version + '/findName/:name', checkToken, async (req, res) => {
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