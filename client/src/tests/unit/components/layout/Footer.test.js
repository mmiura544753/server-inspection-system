import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import Footer from '../../../../components/layout/Footer';

describe('Footer Component', () => {
  // 現在の年を保存
  const realDate = Date;
  const mockDate = new Date('2025-03-29T12:00:00Z');
  
  // テスト前にDateオブジェクトをモック
  beforeEach(() => {
    global.Date = class extends Date {
      constructor() {
        return mockDate;
      }
      static now() {
        return mockDate.getTime();
      }
    };
  });
  
  // テスト後にDateオブジェクトを元に戻す
  afterEach(() => {
    global.Date = realDate;
  });

  // 基本レンダリングをテスト
  it('renders the copyright information with current year', () => {
    render(<Footer />);
    
    // モックした2025年を含む著作権情報が表示されていることを確認
    expect(screen.getByText(/© 2025 Zukosha Co\., Ltd\. All rights reserved\./)).toBeInTheDocument();
  });

  // アプリケーションバージョンの表示をテスト
  it('displays the application version', () => {
    render(<Footer />);
    
    // バージョン情報が表示されていることを確認
    expect(screen.getByText(/v0\.1\.0/)).toBeInTheDocument();
  });

  // フッターのスタイリングクラスをテスト
  it('applies the appropriate styling classes', () => {
    const { container } = render(<Footer />);
    
    // フッター要素に適切なクラスが適用されているか確認
    const footerElement = container.querySelector('.app-footer');
    expect(footerElement).toBeInTheDocument();
    
    // コンテナに適切なクラスが適用されているか確認
    const containerElement = container.querySelector('.container');
    expect(containerElement).toBeInTheDocument();
    expect(containerElement).toHaveClass('d-flex');
    expect(containerElement).toHaveClass('justify-content-between');
    expect(containerElement).toHaveClass('align-items-center');
  });

  // テキスト要素のスタイリングをテスト
  it('applies correct margin classes to text elements', () => {
    const { container } = render(<Footer />);
    
    // 著作権情報とバージョン情報の段落要素が正しいマージンクラスを持っているか確認
    const paragraphs = container.querySelectorAll('p');
    Array.from(paragraphs).forEach(p => {
      expect(p).toHaveClass('m-0');
    });
  });
});