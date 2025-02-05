const ftp = require("basic-ftp");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { processImage } = require("./imageHelper");

const ftpConfig = {
    host: process.env.FTP_URL,
    user: process.env.FTP_USER,
    password: process.env.FTP_PASS,
    secure: false
};

const remoteBasePath = '/CadPlantasBrasil/plants';

async function uploadToFtp(req, res) {
    const files = req.files;

    const client = new ftp.Client();
    try {
        await client.access(ftpConfig);
        await client.ensureDir(remoteBasePath);

        const uploadedFileNames = [];
        for (const file of files) {
            await processImage(req, res, async () => {
                const ext = path.extname(file.originalname).toLowerCase();
                const imageName = `${uuidv4()}${ext}`;
                const remotePath = `${remoteBasePath}/${imageName}`;

                await client.uploadFrom(file.buffer, remotePath);
                uploadedFileNames.push(imageName);
            });
        }

        return uploadedFileNames;
    } catch (error) {
        console.error("Erro ao enviar arquivos para o FTP:", error);
        throw error;
    } finally {
        client.close();
    }
}

module.exports = {
    uploadToFtp
};