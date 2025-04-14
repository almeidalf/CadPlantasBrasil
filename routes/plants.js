const express = require('express');
const path = require('path');
const router = express.Router();
const Plant = require('../models/Plant');
const Group = require('../models/Group'); // ✅ Novo
const checkToken = require('../middlewares/check-token');
const { processImageAndUploadToFtp, deleteMultipleFiles } = require('../helpers/imageHelper');
const ExcelJS = require('exceljs');
const Leaf = require('../models/Leaf');
const Stem = require('../models/Stem');
const Inflorescence = require('../models/Inflorescence');
const Fruit = require('../models/Fruit');
const Color = require('../models/Color');

router.post('/v1/plants/register', checkToken, processImageAndUploadToFtp, async (req, res) => {
    const {
        name,
        nameScientific,
        description,
        location,
        group,
        leaf,
        stem,
        inflorescence,
        fruit,
        leafColor,
        inflorescenceColor,
        fruitColor,
        isPublic
    } = req.body;

    const userId = req.userId;
    const imageReferences = req.imageReferences;

    if (!name || !imageReferences || !group) {
        return res.status(422).json({
            message: "Campos obrigatórios (name, group, imageReferences) devem ser preenchidos"
        });
    }

    const groupDoc = await Group.findOne({ _id: group, subscriber: userId });
    if (!groupDoc) {
        return res.status(422).json({ message: "Grupo inválido ou não pertence ao usuário." });
    }

    const validLocation = typeof location === 'object' && location !== null ? location : {};
    let latitude = validLocation.latitude?.toString().trim() || "0";
    let longitude = validLocation.longitude?.toString().trim() || "0";
    validLocation.latitude = parseFloat(latitude);
    validLocation.longitude = parseFloat(longitude);

    try {
        const [leafDoc, stemDoc, inflorescenceDoc, fruitDoc, leafColorDoc, inflorescenceColorDoc, fruitColorDoc] = await Promise.all([
            leaf ? Leaf.findOne({ type: leaf }) : null,
            stem ? Stem.findOne({ type: stem }) : null,
            inflorescence ? Inflorescence.findOne({ type: inflorescence }) : null,
            fruit ? Fruit.findOne({ type: fruit }) : null,
            leafColor ? Color.findOne({ name: leafColor }) : null,
            inflorescenceColor ? Color.findOne({ name: inflorescenceColor }) : null,
            fruitColor ? Color.findOne({ name: fruitColor }) : null
        ]);

        const plant = new Plant({
            subscriber: userId,
            group: groupDoc._id,
            name,
            nameScientific,
            description,
            location: validLocation,
            images: imageReferences,
            leaf: leafDoc?._id,
            leafColor: leafColorDoc?._id,
            stem: stemDoc?._id,
            inflorescence: inflorescenceDoc?._id,
            inflorescenceColor: inflorescenceColorDoc?._id,
            fruit: fruitDoc?._id,
            fruitColor: fruitColorDoc?._id,
            isPublic: isPublic ?? false
        });

        await plant.save();
        res.status(201).json({ message: "Planta cadastrada com sucesso!" });
    } catch (err) {
        console.error("Erro ao cadastrar planta:", err);
        res.status(500).json({ message: "Erro ao cadastrar planta", error: err.message });
    }
});

router.delete('/v1/plants/:id', checkToken, async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.userId;

        const plant = await Plant.findOne({ _id: plantId, subscriber: userId });

        if (!plant) {
            return res.status(404).json({ message: "Planta não encontrada ou não pertence ao usuário." });
        }

        const deleteResults = await deleteMultipleFiles(plant.images || []);
        await Plant.deleteOne({ _id: plantId });

        res.status(200).json({
            message: "Planta deletada com sucesso!",
            ftpResults: deleteResults
        });
    } catch (err) {
        console.error("Erro ao deletar planta:", err);
        res.status(500).json({ message: "Erro ao deletar planta", error: err.message });
    }
});

router.put('/v1/plants/:id', checkToken, async (req, res) => {
    try {
        const plantId = req.params.id;
        const userId = req.userId;

        const {
            name,
            nameScientific,
            description,
            location,
            group,
            leaf,
            stem,
            inflorescence,
            fruit,
            leafColor,
            inflorescenceColor,
            fruitColor,
            isPublic,
            images = []
        } = req.body;

        const plant = await Plant.findOne({ _id: plantId, subscriber: userId });
        if (!plant) {
            return res.status(404).json({ message: "Planta não encontrada ou não pertence ao usuário." });
        }

        const validLocation = typeof location === 'object' && location !== null
            ? {
                latitude: parseFloat(location.latitude?.toString().trim() || "0"),
                longitude: parseFloat(location.longitude?.toString().trim() || "0")
            }
            : plant.location;

        const [groupDoc, leafDoc, stemDoc, inflorescenceDoc, fruitDoc, leafColorDoc, inflorescenceColorDoc, fruitColorDoc] = await Promise.all([
            group ? Group.findOne({ _id: group, subscriber: userId }) : null,
            leaf ? Leaf.findOne({ type: leaf }) : null,
            stem ? Stem.findOne({ type: stem }) : null,
            inflorescence ? Inflorescence.findOne({ type: inflorescence }) : null,
            fruit ? Fruit.findOne({ type: fruit }) : null,
            leafColor ? Color.findOne({ name: leafColor }) : null,
            inflorescenceColor ? Color.findOne({ name: inflorescenceColor }) : null,
            fruitColor ? Color.findOne({ name: fruitColor }) : null
        ]);

        const imagesBase64 = images.filter(img => img.startsWith('data:image/'));
        const imagesPath = images.filter(img => !img.startsWith('data:image/'));

        const imagesRemoved = plant.images.filter(oldImg => !imagesPath.includes(oldImg));

        let uploadedPaths = [];
        if (imagesBase64.length > 0) {
            uploadedPaths = await uploadToFtp(imagesBase64.map(base64 => ({ base64 })));
        }

        if (imagesRemoved.length > 0) {
            await deleteMultipleFiles(imagesRemoved);
        }

        const finalImages = [...imagesPath, ...uploadedPaths];

        plant.name = name ?? plant.name;
        plant.nameScientific = nameScientific ?? plant.nameScientific;
        plant.description = description ?? plant.description;
        plant.location = validLocation;
        plant.group = groupDoc?._id ?? plant.group;
        plant.leaf = leafDoc?._id ?? plant.leaf;
        plant.stem = stemDoc?._id ?? plant.stem;
        plant.inflorescence = inflorescenceDoc?._id ?? plant.inflorescence;
        plant.fruit = fruitDoc?._id ?? plant.fruit;
        plant.leafColor = leafColorDoc?._id ?? plant.leafColor;
        plant.inflorescenceColor = inflorescenceColorDoc?._id ?? plant.inflorescenceColor;
        plant.fruitColor = fruitColorDoc?._id ?? plant.fruitColor;
        plant.isPublic = isPublic ?? plant.isPublic;
        plant.images = finalImages;

        await plant.save();

        res.status(200).json({
            message: "Planta atualizada com sucesso!",
            updatedImages: finalImages,
            removedImages: imagesRemoved
        });

    } catch (err) {
        console.error("Erro ao atualizar planta:", err);
        res.status(500).json({ message: "Erro ao atualizar planta", error: err.message });
    }
});

router.get('/v1/plants/list', checkToken, async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const plants = await Plant.find(
            { subscriber: userId },
            'name nameScientific description location images isPublic createdAt leaf leafColor stem inflorescence inflorescenceColor fruit fruitColor group subscriber'
        )
            .sort({ createdAt: -1 })
            .populate('leaf', 'type')
            .populate('leafColor', 'type')
            .populate('stem', 'type')
            .populate('inflorescence', 'type')
            .populate('inflorescenceColor', 'type')
            .populate('fruit', 'type')
            .populate('fruitColor', 'type')
            .populate('group', 'name')
            .populate('subscriber', 'name');

        const formatted = plants.map(plant => {
            const imageNames = (plant.images || []).map(imgPath => path.basename(imgPath));
            const toType = field => field?.type ?? null;

            const fullName = plant.subscriber?.name ?? "";
            const nameParts = fullName.trim().split(" ").filter(Boolean);
            const initials = nameParts.length >= 2
                ? `${nameParts[0][0].toUpperCase()}. ${nameParts[nameParts.length - 1]}`
                : nameParts[0] ?? "";

            return {
                id: plant._id,
                name: plant.name,
                nameScientific: plant.nameScientific,
                description: plant.description,
                location: plant.location,
                images: imageNames,
                isPublic: plant.isPublic,
                createdAt: plant.createdAt,
                group: plant.group?.name ?? null,
                registeredBy: initials,
                leaf: toType(plant.leaf),
                leafColor: toType(plant.leafColor),
                stem: toType(plant.stem),
                inflorescence: toType(plant.inflorescence),
                inflorescenceColor: toType(plant.inflorescenceColor),
                fruit: toType(plant.fruit),
                fruitColor: toType(plant.fruitColor)
            };
        });

        res.status(200).json(formatted);
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
            'name nameScientific description location createdAt group'
        ).populate('group', 'name');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantas');

        worksheet.columns = [
            { header: 'Nome', key: 'name', width: 30 },
            { header: 'Nome Científico', key: 'nameScientific', width: 30 },
            { header: 'Descrição', key: 'description', width: 40 },
            { header: 'Latitude', key: 'latitude', width: 20 },
            { header: 'Longitude', key: 'longitude', width: 20 },
            { header: 'Grupo', key: 'group', width: 25 }, // ✅ novo
            { header: 'Data de Cadastro', key: 'createdAt', width: 25 },
        ];

        plants.forEach(plant => {
            worksheet.addRow({
                name: plant.name,
                nameScientific: plant.nameScientific || '',
                description: plant.description,
                latitude: plant.location.latitude,
                longitude: plant.location.longitude,
                group: plant.group?.name ?? '',
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
        const [leaf, stem, inflorescence, fruit, colors] = await Promise.all([
            Leaf.find(),
            Stem.find(),
            Inflorescence.find(),
            Fruit.find(),
            Color.find().sort({ name: 1 })
        ]);

        res.status(200).json({
            leaf: leaf.map(item => item.type),
            stem: stem.map(item => item.type),
            inflorescence: inflorescence.map(item => item.type),
            fruit: fruit.map(item => item.type),
            colors: colors.map(item => item.name)
        });
    } catch (err) {
        console.error("Erro ao buscar partes das plantas:", err);
        res.status(500).json({ message: "Erro ao buscar partes das plantas", error: err.message });
    }
});

module.exports = router;