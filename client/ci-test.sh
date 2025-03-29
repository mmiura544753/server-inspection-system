#!/bin/bash
# CI環境で使用するテスト実行スクリプト

# テストを実行
npm test -- --watchAll=false

# 結果の表示
if [ $? -eq 0 ]; then
    echo "テストは成功しました！"
    exit 0
else
    echo "テストは失敗しました！"
    exit 1
fi