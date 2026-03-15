/**
 * 葡萄酒知识库 - 「每周一酒」系列
 * 创建系列目录节点 + 第一期文章
 *
 * 运行: NODE_TLS_REJECT_UNAUTHORIZED=0 npx tsx scripts/wine_kb_weekly.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// 加载 .env
const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

// ─── Block 工厂 ──────────────────────────────────────────────

function t(content: string, style?: any) { return { text_run: { content, text_element_style: style ?? {} } }; }
function b(content: string) { return t(content, { bold: true }); }
function it(content: string) { return t(content, { italic: true }); }
function p(...elements: any[]) { return { block_type: 2, text: { elements, style: {} } }; }
function h1(text: string) { return { block_type: 3, heading1: { elements: [t(text)], style: {} } }; }
function h2(text: string) { return { block_type: 4, heading2: { elements: [t(text)], style: {} } }; }
function h3(text: string) { return { block_type: 5, heading3: { elements: [t(text)], style: {} } }; }
function li(...elements: any[]) { return { block_type: 12, bullet: { elements, style: {} } }; }
function ol(...elements: any[]) { return { block_type: 13, ordered: { elements, style: {} } }; }
function hr() { return { block_type: 22, divider: {} }; }
function quote(...elements: any[]) { return { block_type: 15, quote: { elements, style: {} } }; }
function img() { return { block_type: 27, image: {} }; }

// ─── curl 工具 ──────────────────────────────────────────────

const { execSync } = require('child_process');

function curlApi(method: string, apiPath: string, token: string, body?: any): any {
  let cmd = `curl -sk --retry 3 --retry-delay 2 -X ${method} "https://open.feishu.cn${apiPath}" -H "Authorization: Bearer ${token}" -H "Content-Type: application/json"`;
  if (body) {
    const tmpFile = `/tmp/feishu_body_${Date.now()}.json`;
    fs.writeFileSync(tmpFile, JSON.stringify(body));
    cmd += ` -d @${tmpFile}`;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 });
      return JSON.parse(result);
    } catch (err: any) {
      if (attempt < 4) { console.log(`  curl 重试 (${attempt + 1}/5)...`); execSync('sleep 3'); }
      else throw err;
    }
  }
}

function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const get = (u: string, redirects = 0) => {
      if (redirects > 5) return reject(new Error('Too many redirects'));
      const mod = u.startsWith('https') ? https : require('http');
      mod.get(u, { rejectUnauthorized: false }, (res: any) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return get(res.headers.location, redirects + 1);
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
      }).on('error', reject);
    };
    get(url);
  });
}

function uploadAndGetToken(token: string, blockId: string, imageBuffer: Buffer, fileName: string): string {
  const tmpFile = `/tmp/wine_weekly_${Date.now()}.jpg`;
  fs.writeFileSync(tmpFile, imageBuffer);
  const result = execSync(
    `curl -sk --retry 5 --retry-delay 3 -X POST "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all" ` +
    `-H "Authorization: Bearer ${token}" ` +
    `-F "file_name=${fileName}" -F "parent_type=docx_image" -F "parent_node=${blockId}" ` +
    `-F "size=${imageBuffer.length}" -F "file=@${tmpFile};type=image/jpeg"`,
    { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
  );
  try { fs.unlinkSync(tmpFile); } catch {}
  const json = JSON.parse(result);
  if (json.code === 0) return json.data.file_token;
  throw new Error(json.msg || `Upload failed: code ${json.code}`);
}

// ─── 配置 ──────────────────────────────────────────────

const SPACE_ID = '7615178195469421499';
const PARENT_NODE = 'LaBgw4iypixpaFkrX9dcyV5Undh'; // Homepage

// ─── 系列介绍页内容 ──────────────────────────────────────

const SERIES_INTRO_BLOCKS = [
  img(), // 封面图

  p(t('')),
  quote(
    b('每周一酒 · Wine of the Week'),
    t('\n每周精选一款葡萄酒，从背景故事到品鉴笔记，从配餐建议到购买渠道。'),
    t('\n不堆参数，只讲你喝得到、用得上的。')
  ),
  p(t('')),
  hr(),

  h1('📋 系列说明'),
  p(t('')),
  p(b('更新频率：'), t('每周一期')),
  p(b('选酒标准：')),
  li(t('国内主流渠道买得到（京东/天猫/山姆/Costco/精品酒商）')),
  li(t('价格覆盖广：从 50 元日常餐酒到 500 元以上精品酒都会涉及')),
  li(t('兼顾经典产区和新兴产区，不只推法国酒')),
  li(t('有故事可讲，不是随便拉一瓶来凑数')),
  p(t('')),

  p(b('每期固定结构：')),
  ol(t('酒款档案（产区、品种、年份、酒精度、价格区间）')),
  ol(t('酒庄/品牌故事')),
  ol(t('品鉴笔记（观色、闻香、入口、余味）')),
  ol(t('配餐建议（中餐 + 西餐场景）')),
  ol(t('饮用建议（适饮温度、醒酒时间、杯型）')),
  ol(t('购买渠道与价格参考')),
  ol(t('同类推荐（喜欢这款还可以试试……）')),
  p(t('')),
  hr(),

  h1('📚 往期目录'),
  p(t('')),
  p(it('第一期内容已发布，更多精彩即将更新……')),
  p(t('')),
  hr(),

  p(t('')),
  quote(
    t('好酒不需要复杂的仪式感。'),
    t('\n打开，倒上，喝一口，觉得好喝——就够了。🍷')
  ),
];

// ─── 第一期内容：奔富 Bin 389 ──────────────────────────────

const EPISODE_01_BLOCKS = [
  img(), // 封面图

  p(t('')),
  quote(
    b('每周一酒 · 第 1 期'),
    t('\n如果只能推荐一款「中国人最熟悉的澳洲酒」，那一定是奔富 Bin 389。'),
    t('\n它不是最贵的，但可能是最「值」的澳洲经典。')
  ),
  p(t('')),
  hr(),

  // ── 酒款档案 ──
  h1('🏷️ 酒款档案'),
  p(t('')),
  p(b('酒名：'), t('Penfolds Bin 389 Cabernet Shiraz')),
  p(b('中文名：'), t('奔富 Bin 389 赤霞珠设拉子')),
  p(b('产区：'), t('澳大利亚 · 南澳（多产区混酿）')),
  p(b('品种：'), t('赤霞珠 Cabernet Sauvignon + 设拉子 Shiraz（比例随年份调整，通常各约 50%）')),
  p(b('年份：'), t('2021（当前主流年份）')),
  p(b('酒精度：'), t('14.5%')),
  p(b('价格区间：'), t('¥280-380（大促期间可低至 ¥250 左右）')),
  p(b('评分参考：'), t('Wine Spectator 91 分 / James Halliday 95 分')),
  p(t('')),
  hr(),

  // ── 酒庄故事 ──
  h1('🏰 酒庄故事'),
  p(t('')),
  p(t('Penfolds（奔富）创立于 1844 年，是澳大利亚最具标志性的酒庄，没有之一。创始人 Christopher Rawson Penfold 是一位英国医生，最初种葡萄是为了给病人酿药用强化酒。没想到，这个「副业」比看病更成功。')),
  p(t('')),
  p(t('Bin 389 诞生于 1960 年，由传奇酿酒师 Max Schubert 创造。它的昵称叫 '), b('「Poor Man\'s Grange」'), t('（穷人的葛兰许），因为酿造 Bin 389 使用的橡木桶，正是酿完 Grange（葛兰许，奔富旗舰，单瓶 ¥3000+）后的「二手桶」。这意味着你能用十分之一的价格，喝到一丝 Grange 的影子。')),
  p(t('')),
  p(t('Max Schubert 的酿酒哲学是：'), it('「好酒不是在葡萄园里种出来的，是在酒窖里混出来的」'), t('。Bin 389 完美体现了这一点——它不追求单一产区的纯粹，而是通过多产区、双品种的混酿，达到风味的平衡和复杂度。')),
  p(t('')),
  hr(),

  // ── 品鉴笔记 ──
  h1('🍷 品鉴笔记'),
  p(t('')),

  h2('👁️ 观色'),
  p(t('深邃的紫红色，边缘略带石榴红，挂杯明显但不过分浓稠。透光看，颜色饱满但不「墨黑」，说明它追求的是优雅而非蛮力。')),
  p(t('')),

  h2('👃 闻香'),
  p(b('第一层（果香）：'), t('成熟黑醋栗、黑莓、蓝莓，带一点李子干的甜润感')),
  p(b('第二层（橡木）：'), t('香草、摩卡咖啡、淡淡的雪松木，这就是 Grange 桶带来的"遗产"')),
  p(b('第三层（复杂）：'), t('黑巧克力、烟熏、一丝薄荷和桉树叶（典型澳洲特征）')),
  p(t('')),
  p(it('💡 小技巧：倒完酒先别急着喝，让它在杯中醒 10-15 分钟，第二层和第三层的香气会明显绽放。')),
  p(t('')),

  h2('👅 入口'),
  p(t('酒体饱满但不笨重（这是 389 和很多廉价澳洲酒的本质区别）。单宁扎实但打磨得很细腻，不会有涩到皱眉的感觉。')),
  p(t('')),
  p(b('赤霞珠贡献了：'), t('骨架、结构、黑醋栗的经典风味')),
  p(b('设拉子贡献了：'), t('肉感、圆润、胡椒和黑莓的奔放')),
  p(t('')),
  p(t('两个品种互补得恰到好处——既不像纯赤霞珠那样「硬」，也不像纯设拉子那样「散」。酸度中等偏上，让整体不会甜腻。')),
  p(t('')),

  h2('🌊 余味'),
  p(t('中长余味，收尾干净。黑巧克力和咖啡的味道在舌根停留，慢慢过渡到一点干燥的矿物感。回味里还能找到一丝甘草的甜。')),
  p(t('')),
  p(b('总体评价：'), t('一款「不会出错」的酒。不会惊艳到让你失语，但绝对不会让你失望。任何场合拿出来都不掉价，自己喝也觉得值。')),
  p(t('')),
  hr(),

  // ── 配餐建议 ──
  h1('🍽️ 配餐建议'),
  p(t('')),

  h2('🥢 中餐场景'),
  p(t('')),
  li(b('红烧肉 / 东坡肉'), t(' —— 酒体和肉的油脂感完美匹配，单宁切油解腻')),
  li(b('烤羊排 / 孜然羊肉'), t(' —— 设拉子的胡椒感和孜然绝配，澳洲酒配烤肉是经典组合')),
  li(b('北京烤鸭'), t(' —— 果香对甜面酱，酒体对鸭皮的油脂，互相成就')),
  li(b('黑椒牛柳'), t(' —— 赤霞珠的黑醋栗和黑胡椒是天生一对')),
  li(b('卤牛腱 / 酱牛肉'), t(' —— 冷盘配 389 非常舒服，酱香和橡木香互相映衬')),
  p(t('')),

  h2('🍽️ 西餐场景'),
  p(t('')),
  li(b('炭烤牛排（五分熟以上）'), t(' —— 最经典的搭配，不用多说')),
  li(b('烤排骨配 BBQ 酱'), t(' —— 澳洲酒配 BBQ，文化上就是一对')),
  li(b('羊排配迷迭香'), t(' —— 389 的桉树叶气息和迷迭香的草本感特别搭')),
  li(b('硬质奶酪拼盘'), t(' —— 切达、帕玛森、格鲁耶尔都合适')),
  p(t('')),

  h3('⚠️ 不推荐搭配'),
  li(t('清蒸鱼、白灼虾等清淡海鲜（会互相打架）')),
  li(t('特别辣的川菜（酒精放大辣感，不舒服）')),
  li(t('甜品（酒里没有残糖，配甜食会显苦）')),
  p(t('')),
  hr(),

  // ── 饮用建议 ──
  h1('🌡️ 饮用建议'),
  p(t('')),
  p(b('适饮温度：'), t('16-18°C。冰箱冷藏 15 分钟即可，别冰太久。夏天如果室温 30°C+，可以冰 20 分钟。')),
  p(b('醒酒：'), t('建议醒酒 30-60 分钟。没有醒酒器的话，提前开瓶 1 小时也行。年轻年份（2021/2022）醒久一点更好喝。')),
  p(b('杯型：'), t('波尔多杯（大肚收口）最佳。杯肚大让酒液充分接触空气，收口聚拢香气。')),
  p(b('陈年潜力：'), t('10-15 年。2021 年份现在喝已经不错，但放到 2027-2030 会更圆融。不着急的话可以买两瓶，喝一瓶存一瓶。')),
  p(t('')),
  hr(),

  // ── 购买渠道 ──
  h1('🛒 购买渠道与价格'),
  p(t('')),
  li(b('京东自营'), t(' —— 日常价 ¥358，大促（618/双11）可到 ¥280 左右，最稳妥')),
  li(b('天猫奔富官方旗舰店'), t(' —— 和京东价格接近，注意辨别授权店')),
  li(b('山姆会员店'), t(' —— 部分门店有售，价格约 ¥320，实体店可以看到实物')),
  li(b('Costco 开市客'), t(' —— 偶尔有特价，约 ¥290')),
  li(b('Wine.com / 也买酒'), t(' —— 海外直邮或国内保税仓，价格波动大')),
  p(t('')),
  p(t('⚠️ '), b('防伪提醒：'), t('奔富是中国市场假酒重灾区。务必从官方授权渠道购买。瓶身有防伪码可以在奔富官网验证。京东自营和山姆基本可以放心。')),
  p(t('')),
  hr(),

  // ── 同类推荐 ──
  h1('🔄 喜欢这款？还可以试试'),
  p(t('')),
  li(b('奔富 Bin 28 Kalimna Shiraz'), t(' —— ¥180-220，纯设拉子，更奔放果味更浓，性价比更高的日常款')),
  li(b('奔富 Bin 128 Coonawarra Shiraz'), t(' —— ¥200-260，冷凉产区设拉子，更优雅细腻')),
  li(b('奔富 Bin 407 Cabernet Sauvignon'), t(' —— ¥350-450，纯赤霞珠，比 389 更硬朗，陈年潜力更强')),
  li(b('禾富 Wolf Blass Gold Label Shiraz'), t(' —— ¥150-200，同为南澳大品牌，果味奔放，入门澳洲酒好选择')),
  li(b('杰卡斯 Jacob\'s Creek Reserve Shiraz'), t(' —— ¥100-150，预算更低时的替代选择，品质稳定')),
  p(t('')),
  hr(),

  p(t('')),
  quote(
    b('本期总结'),
    t('\n奔富 Bin 389 就像是一个「不犯错的老朋友」——'),
    t('\n不张扬、不浮夸，但每次见面都让你觉得靠谱和舒服。'),
    t('\n如果你只买一款 ¥300 价位的酒放在家里，389 永远不会让你后悔。'),
    t('\n\n—— 每周一酒 · 第 1 期 🍷')
  ),
];

// ─── 图片 URL ──────────────────────────────────────────────

const SERIES_COVER_URL = 'https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?w=1200&q=80'; // 酒架
const EP01_COVER_URL = 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80'; // 红酒杯

// ─── 主流程 ──────────────────────────────────────────────

async function createNodeAndWrite(
  token: string,
  parentNode: string,
  title: string,
  blocks: any[],
  coverUrl: string
) {
  // 1. 创建 wiki 节点
  console.log(`\n创建节点: ${title}`);
  const nodeRes = curlApi('POST', `/open-apis/wiki/v2/spaces/${SPACE_ID}/nodes`, token, {
    obj_type: 'docx', node_type: 'origin', parent_node_token: parentNode, title,
  });
  if (nodeRes.code !== 0) {
    console.error(`  创建失败: ${nodeRes.msg} (${nodeRes.code})`);
    return null;
  }
  const nodeToken = nodeRes.data.node.node_token;
  const objToken = nodeRes.data.node.obj_token;
  console.log(`  node: ${nodeToken}, obj: ${objToken}`);
  await new Promise(r => setTimeout(r, 500));

  // 2. 写入 blocks（分批）
  console.log('  写入内容...');
  const chunkSize = 30;
  let imageBlockId = '';
  for (let j = 0; j < blocks.length; j += chunkSize) {
    const chunk = blocks.slice(j, j + chunkSize);
    const res = curlApi('POST', `/open-apis/docx/v1/documents/${objToken}/blocks/${objToken}/children`, token, { children: chunk });
    if (res.code !== 0) {
      console.error(`    blocks ${j}-${j + chunk.length} 失败: ${res.msg}`);
    } else {
      console.log(`    blocks ${j + 1}-${j + chunk.length} ✓`);
      if (j === 0 && res.data?.children?.[0]) {
        imageBlockId = res.data.children[0].block_id;
      }
    }
    if (j + chunkSize < blocks.length) await new Promise(r => setTimeout(r, 300));
  }

  // 3. 上传封面图并 PATCH
  if (imageBlockId && coverUrl) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        console.log('  上传封面图...');
        const buf = await downloadImage(coverUrl);
        const fileToken = uploadAndGetToken(token, imageBlockId, buf, `wine_weekly_cover.jpg`);
        console.log(`    file_token: ${fileToken}`);
        const patchRes = curlApi('PATCH',
          `/open-apis/docx/v1/documents/${objToken}/blocks/${imageBlockId}`,
          token,
          { replace_image: { token: fileToken } }
        );
        if (patchRes.code === 0) {
          console.log('    封面图 PATCH ✓');
        } else {
          console.log(`    PATCH 失败: ${patchRes.msg} (${patchRes.code})`);
        }
        break;
      } catch (err: any) {
        if (attempt < 4) {
          console.log(`    图片重试 (${attempt + 1}/5)`);
          await new Promise(r => setTimeout(r, 2000));
        } else {
          console.error(`    封面图失败: ${err.message}`);
        }
      }
    }
  }

  return { nodeToken, objToken };
}

async function main() {
  console.log('🍷 每周一酒 · 创建系列框架 + 第一期\n');

  const userTokenFile = path.resolve(__dirname, '../../startup-7steps/.feishu-user-token.json');
  const tokenData = JSON.parse(fs.readFileSync(userTokenFile, 'utf-8'));
  const elapsed = (Date.now() - new Date(tokenData.saved_at).getTime()) / 1000;
  if (elapsed >= tokenData.expires_in - 60) {
    console.error('Token 过期，请先运行: cd ~/startup-7steps && NODE_TLS_REJECT_UNAUTHORIZED=0 node feishu-auth.js');
    return;
  }
  const token = tokenData.access_token;
  console.log(`Token OK (剩余 ${Math.round(tokenData.expires_in - elapsed)}s)\n`);

  // Step 1: 创建「每周一酒」系列目录节点
  const seriesResult = await createNodeAndWrite(
    token, PARENT_NODE,
    '🍷 每周一酒',
    SERIES_INTRO_BLOCKS,
    SERIES_COVER_URL
  );
  if (!seriesResult) {
    console.error('创建系列节点失败，退出');
    return;
  }
  console.log(`\n系列节点创建成功: ${seriesResult.nodeToken}`);
  await new Promise(r => setTimeout(r, 500));

  // Step 2: 创建第一期文章（作为系列子节点）
  const ep01Result = await createNodeAndWrite(
    token, seriesResult.nodeToken,
    '第 1 期：奔富 Bin 389 —— 穷人的葛兰许',
    EPISODE_01_BLOCKS,
    EP01_COVER_URL
  );
  if (ep01Result) {
    console.log(`\n第一期创建成功: ${ep01Result.nodeToken}`);
  }

  // Step 3: 更新 Homepage，加入每周一酒链接
  console.log('\n\n更新 Homepage 导航...');
  const HOMEPAGE_DOC = 'XaEVdjuYkomGyfxdMPpcGQItnbe';

  // 获取现有 blocks 数量
  const listRes = curlApi('GET', `/open-apis/docx/v1/documents/${HOMEPAGE_DOC}/blocks?page_size=5`, token);
  if (listRes.code === 0) {
    const childCount = listRes.data.items[0]?.children?.length ?? 0;
    // 在最后追加每周一酒板块（在末尾 quote 之前）
    const newBlocks = [
      h1('🍷 每周一酒'),
      p(t('每周精选一款酒，从故事到品鉴，从配餐到购买。')),
      p(t('')),
      { block_type: 12, bullet: { elements: [
        { text_run: { content: '🍷 每周一酒（系列首页）', text_element_style: { bold: true, link: { url: `https://hcn2vc1r2jus.feishu.cn/wiki/${seriesResult.nodeToken}` } } } },
        { text_run: { content: ' —— 往期目录、选酒标准、系列说明', text_element_style: {} } },
      ], style: {} } },
    ];
    if (ep01Result) {
      newBlocks.push(
        { block_type: 12, bullet: { elements: [
          { text_run: { content: '第 1 期：奔富 Bin 389', text_element_style: { bold: true, link: { url: `https://hcn2vc1r2jus.feishu.cn/wiki/${ep01Result.nodeToken}` } } } },
          { text_run: { content: ' —— 穷人的葛兰许，¥300 价位的最佳选择', text_element_style: {} } },
        ], style: {} } },
      );
    }
    newBlocks.push(p(t('')), hr());

    // 插入到倒数第3个位置（在最后的空行和结尾 quote 之前）
    const insertIndex = Math.max(childCount - 2, childCount);
    const addRes = curlApi('POST',
      `/open-apis/docx/v1/documents/${HOMEPAGE_DOC}/blocks/${HOMEPAGE_DOC}/children`,
      token,
      { children: newBlocks, index: insertIndex }
    );
    if (addRes.code === 0) {
      console.log('  Homepage 已添加每周一酒板块 ✓');
    } else {
      console.log(`  Homepage 更新失败: ${addRes.msg} (${addRes.code})`);
    }
  }

  console.log('\n\n✅ 每周一酒系列创建完成！');
  console.log(`系列首页：https://hcn2vc1r2jus.feishu.cn/wiki/${seriesResult.nodeToken}`);
  if (ep01Result) {
    console.log(`第 1 期：https://hcn2vc1r2jus.feishu.cn/wiki/${ep01Result.nodeToken}`);
  }
  console.log(`\n知识库首页：https://hcn2vc1r2jus.feishu.cn/wiki/${PARENT_NODE}`);
}

main().catch(err => {
  console.error('错误:', err.message ?? err);
  process.exit(1);
});
