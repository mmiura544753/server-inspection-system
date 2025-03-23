#!/bin/bash

# 色の設定
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== サーバー点検システム テスト実行スクリプト ===${NC}"
echo

# サーバー側のテスト実行
echo -e "${BLUE}サーバー側テストを実行中...${NC}"
cd /home/ubuntu/server-inspection-system/server
npm test
SERVER_TEST_EXIT_CODE=$?

# クライアント側のテスト実行
echo -e "\n${BLUE}クライアント側テストを実行中...${NC}"
cd /home/ubuntu/server-inspection-system/client
npm test -- --watchAll=false
CLIENT_TEST_EXIT_CODE=$?

# 結果表示
echo
echo -e "${BLUE}=== テスト結果サマリー ===${NC}"
if [ $SERVER_TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ サーバー側テスト: 成功${NC}"
else
  echo -e "${RED}✗ サーバー側テスト: 失敗${NC}"
fi

if [ $CLIENT_TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ クライアント側テスト: 成功${NC}"
else
  echo -e "${RED}✗ クライアント側テスト: 失敗${NC}"
fi

# 最終結果
if [ $SERVER_TEST_EXIT_CODE -eq 0 ] && [ $CLIENT_TEST_EXIT_CODE -eq 0 ]; then
  echo -e "\n${GREEN}✓ 全てのテストが成功しました${NC}"
  exit 0
else
  echo -e "\n${RED}✗ テストに失敗があります${NC}"
  exit 1
fi