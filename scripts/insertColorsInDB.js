require('dotenv').config();
const mongoose = require('mongoose');
const mongoUri = require('../config/db');

const ColorSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
});

const Color = mongoose.model('Color', ColorSchema);

(async () => {
    try {
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

    console.log('✅ MongoDB conectado');

    const colors = [
        "Amarelo",
        "Azul",
        "Branco",
        "Laranja",
        "Marrom",
        "Roxo",
        "Verde",
        "Vermelho"
    ];

    await Color.deleteMany({});

        const inserted = await Color.insertMany(colors.map(name => ({ name })));
        console.log(`🌈 Cores inseridas com sucesso: ${inserted.length}`);

    } catch (error) {
        console.error("❌ Erro ao inserir cores:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB desconectado");
    }
})();