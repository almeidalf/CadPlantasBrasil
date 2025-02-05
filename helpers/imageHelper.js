const sharp = require('sharp');
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");

// Função para decodificar a imagem Base64 e comprimir
const processBase64Image = async (base64Str) => {
    const cleanedBase64Str = base64Str.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(cleanedBase64Str, 'base64'); // Decodificando Base64 para buffer
    const compressedBuffer = await sharp(buffer)
        .resize(1280, 720, { fit: 'inside' }) // Ajuste para redimensionar as imagens
        .jpeg({ quality: 80 })  // Ajustando a qualidade para 80%
        .toBuffer();  // Retorna o buffer da imagem comprimida
    return compressedBuffer;
};

const processImageAndUploadToFtp = async (req, res, next) => {
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        try {
            // Decodificar as imagens Base64 e fazer o upload para o FTP
            const files = req.body.images.map(imageBase64 => ({
                base64: imageBase64
            }));

            const imageReferences = await uploadToFtp(files);

            // Armazenando as referências das imagens para o banco de dados
            req.imageReferences = imageReferences; // Salva as referências para o banco
            next();
        } catch (error) {
            console.error("Erro ao processar as imagens:", error);
            return res.status(500).json({ message: 'Erro ao processar as imagens e enviá-las para o FTP', error: error.message });
        }
    } else {
        // Caso não haja imagens no corpo da requisição, continua o fluxo
        next();
    }
};

// Função para enviar as imagens redimensionadas para o FTP
async function uploadToFtp(files) {
    const client = new ftp.Client();
    const uploadedFileNames = [];
    const remoteBasePath = '/CadPlantasBrasil/plants'; // O diretório remoto no FTP

    try {
        // Conectando ao FTP
        await client.access({
            host: process.env.FTP_URL,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: false, // Mudar para true se usar FTPS
        });

        await client.ensureDir(remoteBasePath);

        // Fazendo o upload de cada imagem
        for (const file of files) {
            // Processando e comprimindo a imagem
            const compressedBuffer = await processBase64Image(file.base64);

            // Gera um nome único para o arquivo
            const ext = '.jpg';  // Assumindo que você vai salvar como JPG
            const imageName = `${uuidv4()}${ext}`;
            const remotePath = `${remoteBasePath}/${imageName}`;

            // Envia a imagem comprimida para o FTP
            await client.uploadFrom(compressedBuffer, remotePath);

            // Armazena o nome da imagem para ser salvo no banco de dados
            uploadedFileNames.push(remotePath);
        }

        return uploadedFileNames; // Retorna os caminhos das imagens no FTP
    } catch (error) {
        console.error("Erro ao enviar imagens para o FTP:", error);
        throw error;
    } finally {
        client.close(); // Fecha a conexão FTP
    }
}

module.exports = {
    processImageAndUploadToFtp
};