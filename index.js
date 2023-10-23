const express = require('express');

const server = express();

server.use(express.json());

const plantas = ['Rosa', 'Violeta', 'Margarida'];

server.get('/plantas/:index', (req, res) =>  {
    const { index } = req.params;

    return res.json(plantas[index]);
});

server.get('/plantas', (req, res) => {
    return res.json(plantas);
});

server.post('/plantas', (req, res) => {
    const { name } = req.body;

    plantas.push(name);
});

server.put('/plantas/:index', (req, res) => {
    const { index } = req.params
    const { name } = req.body

    plantas[index] = name

    return res.json(plantas);
});

server.delete('plantas/:index', (req,res) => {
    const { index } = req.params

    plantas.splice(index, 1);
    return res.json({ message: "A planta foi deletada" });
});

server.listen('3000')