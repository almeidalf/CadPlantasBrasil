const sharp = require('sharp');
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const { Readable } = require('stream');

// Função para decodificar a imagem Base64 e comprimir
const processBase64Image = async (base64Str) => {
    const cleanedBase64Str = base64Str.replace(/^data:image\/[a-z]+;base64,/, "");

    // Converter a string para um buffer
    const buffer = Buffer.from(cleanedBase64Str, 'base64');

    let compressedBuffer;
    try {
        compressedBuffer = await sharp(buffer)
            .resize(1280, 720, { fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();
    } catch (err) {
        console.error("Erro no processamento da imagem com Sharp:", err);
        throw err;
    }

    return compressedBuffer;
};

const processImageAndUploadToFtp = async (req, res, next) => {
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        try {
            // Mapeia as imagens enviadas (em Base64)
            const files = req.body.images.map(imageBase64 => ({
                base64: imageBase64
            }));

            // Salva as referências das imagens para uso posterior (ex: armazenamento no banco)
            req.imageReferences = await uploadToFtp(files);
            next();
        } catch (error) {
            console.error("Erro ao processar as imagens:", error);
            return res.status(500).json({
                message: 'Erro ao processar as imagens e enviá-las para o FTP',
                error: error.message
            });
        }
    } else {
        // Se não houver imagens no corpo da requisição, segue o fluxo normalmente
        next();
    }
};

// Função para enviar as imagens processadas para o FTP
async function uploadToFtp(files) {
    const client = new ftp.Client(60000);
    const uploadedFileNames = [];
    const remoteBasePath = '/home/cadplantas/images';

    try {
        await client.access({
            host: process.env.FTP_URL,
            port: 21,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        await client.ensureDir(remoteBasePath);

        for (const file of files) {
            try {
                const processedBuffer = await processBase64Image(file.base64);

                const imageName = `${uuidv4()}.jpg`;
                const remotePath = `${remoteBasePath}/${imageName}`;

                await client.uploadFrom(Readable.from(processedBuffer), remotePath);
                console.log(`Imagem enviada: ${remotePath}`);

                uploadedFileNames.push(remotePath);
            } catch (err) {
                console.error("Erro ao processar ou enviar imagem:", err);
            }
        }

        return uploadedFileNames;
    } catch (error) {
        console.error("Erro geral no envio FTP:", error);
        throw error;
    } finally {
        client.close();
    }
}

module.exports = {
    processImageAndUploadToFtp
};