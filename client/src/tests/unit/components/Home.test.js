import React from 'react';
import { render, screen } from '../../../tests/utils/test-utils';
import '@testing-library/jest-dom';
import Home from '../../../components/Home';

// react-router-domのLinkコンポーネントをモック
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => (
    <a href={to} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('Home Component', () => {
  it('renders the title correctly', () => {
    render(<Home />);
    
    const titleElement = screen.getByText('サーバー点検管理システム');
    expect(titleElement).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<Home />);
    
    const descriptionText = screen.getByText(/サーバーやネットワーク機器の点検作業を効率的に管理するシステムです/);
    expect(descriptionText).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Home />);
    
    // 各リンクが存在することを確認
    const links = screen.getAllByTestId('mock-link');
    expect(links.length).toBeGreaterThan(0);
    
    // 特定のセクションタイトルがあることを確認
    expect(screen.getByText('点検作業を開始')).toBeInTheDocument();
    expect(screen.getByText('マスタ管理')).toBeInTheDocument();
  });

  it('renders service cards', () => {
    render(<Home />);
    
    // 各サービスカードのタイトルが存在することを確認
    expect(screen.getAllByText('点検項目')).toHaveLength(2); // リンクとカードタイトルの両方で使用されているため2つ
    expect(screen.getByText('点検作業')).toBeInTheDocument();
    expect(screen.getAllByText('機器管理')).toHaveLength(2);
    expect(screen.getAllByText('顧客管理')).toHaveLength(2);
    expect(screen.getByText('点検結果管理')).toBeInTheDocument();
  });
});