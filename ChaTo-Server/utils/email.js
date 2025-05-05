const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: `ChaTo App <${process.env.EMAIL_USER}>`,
    to,
    subject: 'ChaTo - Email Verification',
    html: `<div style="font-family:sans-serif"><h2>رمز التحقق الخاص بك:</h2><p style="font-size:22px;font-weight:bold">${code}</p><p>يرجى إدخال هذا الرمز لإكمال عملية التسجيل.</p></div>`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail }; 