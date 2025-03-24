// server/fonts/download-fonts.js
const fs = require('fs');
const path = require('path');
const https = require('https');

// フォントをダウンロードする関数
function downloadFont(url, outputPath) {
  console.log(`Downloading font from ${url} to ${outputPath}...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      // リダイレクトをチェック
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        console.log(`Redirecting to ${response.headers.location}`);
        downloadFont(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP status code ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`Successfully downloaded ${outputPath}`);
        resolve(outputPath);
      });
    }).on('error', (err) => {
      fs.unlink(outputPath, () => {}); // エラー時は部分的にダウンロードされたファイルを削除
      console.error(`Download error: ${err.message}`);
      reject(err);
    });
  });
}

// フォントの保存先ディレクトリ
const fontsDir = __dirname;

// ダウンロードが必要なフォントとURL
const fonts = [
  {
    name: 'ipaexg.ttf', // IPAex ゴシック
    url: 'https://moji.or.jp/wp-content/ipafont/IPAexfont/ipaexg00401.zip'
  },
  {
    name: 'ipaexm.ttf', // IPAex 明朝
    url: 'https://moji.or.jp/wp-content/ipafont/IPAexfont/ipaexm00401.zip'
  }
];

// フォントをダウンロード
async function downloadFonts() {
  console.log('Starting font downloads...');
  
  for (const font of fonts) {
    const outputPath = path.join(fontsDir, font.name);
    
    // 既にファイルが存在するかチェック
    if (fs.existsSync(outputPath)) {
      console.log(`${font.name} already exists, skipping...`);
      continue;
    }
    
    try {
      await downloadFont(font.url, outputPath);
    } catch (error) {
      console.error(`Failed to download ${font.name}: ${error.message}`);
    }
  }
  
  console.log('Font download completed.');
}

// スクリプト実行
downloadFonts().catch(err => {
  console.error('An error occurred during font download:', err);
  process.exit(1);
});