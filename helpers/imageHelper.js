const sharp = require('sharp');
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const { Readable } = require('stream');

let queue;

const getQueue = async () => {
    if (!queue) {
        const PQueue = (await import('p-queue')).default;
        queue = new PQueue({ concurrency: 10 });
    }
    return queue;
};

const processBase64Image = async (base64Str) => {
    const cleanedBase64Str = base64Str.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(cleanedBase64Str, 'base64');

    try {
        return await sharp(buffer)
            .resize(1280, 720, { fit: 'inside' })
            .jpeg({ quality: 80 })
            .toBuffer();
    } catch (err) {
        console.error("Erro no processamento da imagem com Sharp:", err);
        throw err;
    }
};

const processImageAndUploadToFtp = async (req, res, next) => {
    if (req.body.images && Array.isArray(req.body.images) && req.body.images.length > 0) {
        try {
            const files = req.body.images.map(base64 => ({ base64 }));
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
        next();
    }
};

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
        const queueInstance = await getQueue();

        for (const file of files) {
            await queueInstance.add(async () => {
                try {
                    const processedBuffer = await processBase64Image(file.base64);
                    const imageName = `${uuidv4()}.jpg`;
                    const remotePath = `${remoteBasePath}/${imageName}`;
                    await client.uploadFrom(Readable.from(processedBuffer), remotePath);
                    uploadedFileNames.push(remotePath);
                } catch (err) {
                    console.error("Erro ao processar ou enviar imagem:", err);
                    throw err;
                }
            });
        }

        return uploadedFileNames;

    } catch (error) {
        console.error("Erro geral no envio FTP:", error);
        throw error;
    } finally {
        client.close();
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function deleteWithRetry(client, remotePath, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await client.remove(remotePath);
            console.log(`✅ Deletado (tentativa ${attempt}):`, remotePath);
            return { path: remotePath, success: true };
        } catch (err) {
            console.warn(`⚠️ Falha tentativa ${attempt} para deletar ${remotePath}:`, err.message);
            if (attempt < maxRetries) {
                await delay(500); // espera antes de tentar de novo
            } else {
                return { path: remotePath, success: false, error: err.message };
            }
        }
    }
}

async function deleteMultipleFiles(filePaths = []) {
    if (!Array.isArray(filePaths) || filePaths.length === 0) return [];

    const client = new ftp.Client();
    const results = [];

    try {
        await client.access({
            host: process.env.FTP_URL,
            port: 21,
            user: process.env.FTP_USER,
            password: process.env.FTP_PASS,
            secure: true,
            secureOptions: { rejectUnauthorized: false }
        });

        for (const remotePath of filePaths) {
            const result = await deleteWithRetry(client, remotePath);
            results.push(result);
        }

    } catch (err) {
        console.error("❌ Erro ao conectar no FTP:", err.message);
        throw err;
    } finally {
        client.close();
    }

    return results;
}

module.exports = {
    processImageAndUploadToFtp,
    deleteMultipleFiles,
};