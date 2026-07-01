const sharp = require('C:\\Users\\pc_msi\\AppData\\Roaming\\npm\\node_modules\\sharp-cli\\node_modules\\sharp');
const fs = require('fs');

async function run() {
  const products = ['iphone', 'airpods'];
  const srcMap = { iphone: 'iphone animated', airpods: 'airpods animated' };
  for (const p of products) {
    const dir = 'frontend/public/frames/' + p;
    fs.mkdirSync(dir, { recursive: true });
    for (let i = 1; i <= 51; i++) {
      const n = String(i).padStart(3, '0');
      const src = srcMap[p] + '/ezgif-frame-' + n + '.jpg';
      const dst = dir + '/' + n + '.webp';
      await sharp(src).resize(800).webp({ quality: 72 }).toFile(dst);
    }
    console.log(p + ' done');
  }
}
run().catch(e => { console.error(e); process.exit(1); });
