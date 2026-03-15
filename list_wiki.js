const https=require('https');
const {SocksProxyAgent}=require('/Users/simon/feishu-sdk/node_modules/socks-proxy-agent');
const agent=new SocksProxyAgent('socks5h://127.0.0.1:7897');
const fs=require('fs');
const tk=JSON.parse(fs.readFileSync('/Users/simon/startup-7steps/.feishu-user-token.json')).access_token;
const SI='7616033289844821185',RN='W1ohwQfKviDg3IkeV68c0N0bnyc';

function get(p){return new Promise((r,j)=>{
  const q=https.request({hostname:'open.feishu.cn',path:p,method:'GET',agent,headers:{'Authorization':'Bearer '+tk},rejectUnauthorized:false},s=>{
    let d='';s.on('data',c=>d+=c);s.on('end',()=>{try{r(JSON.parse(d))}catch{r(d)}});
  });q.on('error',j);q.end();
})}

async function listAll(parentToken) {
  let token=null, items=[];
  do {
    const url='/open-apis/wiki/v2/spaces/'+SI+'/nodes?parent_node_token='+parentToken+'&page_size=50'+(token?'&page_token='+token:'');
    const r=await get(url);
    if(r.code!==0){console.error('err',r.code,r.msg);return [];}
    items=items.concat(r.data.items||[]);
    token=r.data.page_token;
  } while(token);
  return items;
}

async function main(){
  const roots=await listAll(RN);
  console.log('Root folders:',roots.length,'\n');
  for(const n of roots){
    const cats=await listAll(n.node_token);
    let total=0;
    for(const c of cats){
      const arts=await listAll(c.node_token);
      total+=arts.length;
    }
    console.log(n.title+' | cats:'+cats.length+' | articles:'+total+' | token:'+n.node_token);
  }
}
main().catch(e=>console.error(e.message));
