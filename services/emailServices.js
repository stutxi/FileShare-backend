const nodemailer = require('nodemailer');

async function sendMail({ from, to, subject, text, html }) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    let info = await transporter.sendMail({
        from: `FileShare <${from}>`,
        to: to,
        subject: subject,
        text: text,
        html: html
    });
    console.log(info); 
}


module.exports = sendMail;