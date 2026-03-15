const lark = require('@larksuiteoapi/node-sdk');
const fs = require('fs');
const envFile = fs.readFileSync(require('path').join(__dirname, '..', '.env'), 'utf-8');
envFile.split('\n').forEach(l => { const [k,...v] = l.split('='); if(k && v.length) process.env[k.trim()] = v.join('=').trim(); });

const client = new lark.Client({
  appId: process.env.FEISHU_APP_ID,
  appSecret: process.env.FEISHU_APP_SECRET,
  appType: lark.AppType.SelfBuild,
  domain: lark.Domain.Feishu,
});

client.im.chat.list({ params: { page_size: 50 } }).then(res => {
  if (res.code !== 0) { console.log('Error:', res.code, res.msg); return; }
  (res.data.items || []).forEach(c => console.log(c.chat_id + ' | ' + c.name));
}).catch(e => console.error(e.message));
