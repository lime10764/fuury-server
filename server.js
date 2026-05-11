const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- 邮箱配置 ----------
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
  auth: { user: MAIL_USER, pass: MAIL_PASS }
});

// 发验证码
app.post('/sendMailCode', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ code: -1, msg: '邮箱不能为空' });
  const code = get6Code();
  mailCodeStore.set(email, { code, time: Date.now() });

  const mailOptions = {
    from: `${APP_NAME}官方 <${MAIL_USER}>`,
    subject: `【${APP_NAME}】注册验证码`,
    text: `验证码：${code}，5分钟内有效`
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ code: 0, msg: '发送成功' });
  } catch {
    res.json({ code: -2, msg: '发送失败' });
  }
});

// 邮箱注册
app.post('/mailRegister', (req, res) => {
  const { email, code, password } = req.body;
  if (!email||!code||!password) return res.json({code:-1,msg:'参数不全'});
  if (!mailCodeStore.has(email)) return res.json({code:-2,msg:'先获取验证码'});
  const item = mailCodeStore.get(email);
  if (Date.now()-item.time>EXPIRE) {
    mailCodeStore.delete(email);
    return res.json({code:-3,msg:'验证码过期'});
  }
  if (item.code!==code) return res.json({code:-4,msg:'验证码错误'});
  mailCodeStore.delete(email);
  res.json({code:0,msg:'注册成功'});
});

// 赞助接口
app.get('/getDonateUrl', (req, res) => {
  res.json({code:0,url:"#付款:ddkdn(WMJFURRY)/个人赞助等收款/001"});
});

// ---------- 文件上传配置 ----------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req,file,cb)=>cb(null,uploadDir),
  filename: (req,file,cb)=>{
    const name = Date.now()+"_"+Math.random().toString(36).slice(2);
    cb(null, name+path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// 1. 上传接口
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({code:-1,msg:'上传失败'});
  res.json({
    code:0,
    fileId: req.file.filename,
    msg:"上传成功"
  });
});

// 2. ✅ 真正的删除接口（补上了你缺的）
app.delete('/delete/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const fp = path.join(uploadDir, fileId);
  if (fs.existsSync(fp)) {
    fs.unlinkSync(fp);
    return res.json({code:0,msg:"删除成功"});
  }
  res.json({code:-1,msg:"文件不存在"});
});

// 3. 视频/图片播放接口（只能播放，不能下载）
app.get('/play/:fileId', (req, res) => {
  const fileId = req.params.fileId;
  const fp = path.join(uploadDir, fileId);
  if (!fs.existsSync(fp)) return res.status(404).send('Not Found');

  res.setHeader('Content-Disposition','inline');
  res.setHeader('Cache-Control','no-cache');
  const stream = fs.createReadStream(fp);
  stream.pipe(res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('服务运行中');
});
