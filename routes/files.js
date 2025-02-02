const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const File = require('../models/file');
const { v4: uuid4 } = require('uuid');

let storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random()*1E9)}${path.extname(file.originalname)}`;
        cb (null, uniqueName);
    }
})

let upload = multer({
storage: storage,
limit: { fileSize: 1000000 * 100 }
}).single('myfile');


router.post('/', (req, res) => {
    upload(req, res, async (err) => {
        if (!req.file) {
            return res.json({
                error: 'All fields are required!'
            });
        }
        if (err) {
            return res.status(500).send({
                error: err.message
            })
        }
        //store into database
        const file = new File({
            filename: req.file.filename,
            uuid: uuid4(),
            path: req.file.path,
            size: req.file.size
        });

        const response = await file.save();
        return res.json({
            // https://localhost:3000/files/384774gffhhf-2838fbbfn
            file: `${process.env.APP_BASE_URL}/files/${response.uuid}`
        });
    });
});


router.post('/send', async (req, res) => {
    const { uuid, emailTo, emailFrom } = req.body;
    //validate request
    if (!uuid || !emailTo || !emailFrom) {
        return res.status(422).send({
            error: 'All fields are required!'
        });
    }
    //get data from database
    const file = await File.findOne({
        uuid: uuid
    });
    if (file.sender) {
        return res.status(422).send({
            error: 'File already sent!'
        });
    }
    file.sender = emailFrom;
    file.receiver = emailTo;
    const response = await file.save();

    //send mail
    const sendMail = require('../services/emailServices');
    sendMail ({
        from: emailFrom,
        to: emailTo,
        subject: 'FileShare - File Sharing Email Service',
        text: `${emailFrom} shared a file with you.`,
        html: require('../services/emailTemplate') ({
            emailFrom: emailFrom,
            downloadLink: `${process.env.APP_BASE_URL}/files/${file.uuid}`,
            size: parseInt(file.size/1000) + ' KB',
            expires: '24 hours'
        })
    });
    return res.send({
        message: 'File sent successfully!'
    });
});



module.exports = router;