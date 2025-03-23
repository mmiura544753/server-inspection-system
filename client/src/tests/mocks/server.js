// テスト用のモックサーバー設定
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// MSWサーバーの作成
export const server = setupServer(...handlers);