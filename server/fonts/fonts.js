// server/fonts/fonts.js
const path = require('path');
const fs = require('fs');

// デフォルトフォントパスを定義
const BASE_FONT_PATH = path.join(__dirname, './');

// 日本語フォントファイル
const DEFAULT_FONTS = {
  normal: {
    path: path.join(BASE_FONT_PATH, 'Helvetica.ttf'),
    fallback: 'Helvetica'
  },
  bold: {
    path: path.join(BASE_FONT_PATH, 'Helvetica-Bold.ttf'),
    fallback: 'Helvetica-Bold'
  }
};

// システムに登録されたフォントを取得する
function getSystemFonts() {
  return DEFAULT_FONTS;
}

// 日本語フォントパスを取得
function getJapaneseFontPath(type = 'normal') {
  const fonts = getSystemFonts();
  
  if (!fonts[type]) {
    console.warn(`フォントタイプ "${type}" が見つかりません。デフォルトを使用します。`);
    return {
      path: fonts.normal.path,
      fallback: fonts.normal.fallback
    };
  }
  
  // フォントファイルの存在確認
  const fontInfo = fonts[type];
  if (fs.existsSync(fontInfo.path)) {
    return fontInfo;
  } else {
    console.warn(`フォントファイル "${fontInfo.path}" が見つかりません。フォールバックを使用します。`);
    return {
      path: null,
      fallback: fontInfo.fallback
    };
  }
}

module.exports = {
  getSystemFonts,
  getJapaneseFontPath
};