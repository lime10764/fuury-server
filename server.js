const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const MAIL_USER = "2267588142@qq.com";
const MAIL_PASS = "hbxqcguavucdhgd";
const APP_NAME = "社区FUURY";

const mailCodeStore = new Map();
const EXPIRE = 5 * 60 * 1000;

function get6Code() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  host: "smtp.qq.com",
  port: 465,
  secure: true,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS
  }
});

app.post('/sendMailCode', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ code: -1, msg: '邮箱不能为空' });

  const code = get6Code();
  mailCodeStore.set(email, { code, time: Date.now() });

  const mailOptions = {
    from: `${APP_NAME}官方 <${MAIL_USER}>`,
    subject: `【${APP_NAME}】注册验证码`,
    text: `您好！
您正在注册 ${APP_NAME} 账号
本次验证码：【${code}】
有效期5分钟，请勿泄露
如非本人操作请忽略

${APP_NAME} 官方团队`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ code: 0, msg: '验证码已发送，请查邮箱' });
  } catch (err) {
    res.json({ code: -2, msg: '发送失败' });
  }
});

app.post('/mailRegister', (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password)
    return res.json({ code: -1, msg: '信息不能为空' });

  if (!mailCodeStore.has(email))
    return res.json({ code: -2, msg: '请先获取验证码' });

  let item = mailCodeStore.get(email);
  if (Date.now() - item.time > EXPIRE) {
    mailCodeStore.delete(email);
    return res.json({ code: -3, msg: '验证码过期' });
  }

  if (item.code !== code)
    return res.json({ code: -4, msg: '验证码错误' });

  mailCodeStore.delete(email);
  res.json({ code: 0, msg: '注册成功' });
});

app.get('/getDonateUrl', (req, res) => {
  let url = "#付款:ddkdn(WMJFURRY)/个人赞助等收款/001";
  res.json({ code:0, url:url });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("社区FUURY 服务已启动");
});
