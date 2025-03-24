// server/fonts/download-fonts.js
const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// ダウンロードディレクトリ
const downloadsDir = path.join(__dirname, 'downloads');
// フォントの保存先ディレクトリ
const fontsDir = __dirname;

// IPAフォントのZIPファイルをダウンロードする関数
async function downloadIPAFonts() {
  console.log('IPAフォントのダウンロード処理を開始します...');
  
  // ダウンロードディレクトリの確認・作成
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }
  
  // IPAexフォントのダウンロードURL
  const ipaexURL = 'https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip';
  const zipPath = path.join(downloadsDir, 'IPAexfont.zip');
  
  // wgetコマンドを使用してダウンロード
  console.log(`IPAexフォントをダウンロード中: ${ipaexURL}`);
  
  try {
    // ファイルの存在確認
    if (fs.existsSync(zipPath)) {
      console.log('ZIPファイルは既に存在します。スキップします。');
    } else {
      // wget -O を使ってファイルをダウンロード
      await execAsync(`wget -O ${zipPath} ${ipaexURL}`);
      console.log('ZIPファイルのダウンロードが完了しました。');
    }
    
    // 解凍先ディレクトリ
    const extractDir = path.join(downloadsDir, 'extracted');
    if (!fs.existsSync(extractDir)) {
      fs.mkdirSync(extractDir, { recursive: true });
    }
    
    // unzipコマンドを使用して解凍
    await execAsync(`unzip -o ${zipPath} -d ${extractDir}`);
    console.log('ZIPファイルの解凍が完了しました。');
    
    // IPAexゴシックとIPAex明朝をフォントディレクトリにコピー
    const ipaexgPath = path.join(extractDir, 'IPAexfont00401/ipaexg.ttf');
    const ipaexmPath = path.join(extractDir, 'IPAexfont00401/ipaexm.ttf');
    
    // コピー先のパス
    const destIpaexgPath = path.join(fontsDir, 'ipaexg.ttf');
    const destIpaexmPath = path.join(fontsDir, 'ipaexm.ttf');
    
    if (fs.existsSync(ipaexgPath)) {
      fs.copyFileSync(ipaexgPath, destIpaexgPath);
      console.log(`IPAexゴシックフォントをコピーしました: ${destIpaexgPath}`);
    } else {
      console.error('IPAexゴシックフォントが見つかりません。');
    }
    
    if (fs.existsSync(ipaexmPath)) {
      fs.copyFileSync(ipaexmPath, destIpaexmPath);
      console.log(`IPAex明朝フォントをコピーしました: ${destIpaexmPath}`);
    } else {
      console.error('IPAex明朝フォントが見つかりません。');
    }
    
    console.log('フォントのダウンロードと設定が完了しました。');
    return true;
  } catch (error) {
    console.error('フォントダウンロード中にエラーが発生しました:', error);
    return false;
  }
}

// スクリプト実行
downloadIPAFonts().catch(err => {
  console.error('An error occurred during font download:', err);
  process.exit(1);
});