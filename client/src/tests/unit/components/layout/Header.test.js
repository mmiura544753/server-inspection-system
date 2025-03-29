import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Header from '../../../../components/layout/Header';

describe('Header Component', () => {
  // 基本レンダリングをテスト
  it('renders the logo and site title', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    // ロゴ画像が存在することを確認
    const logoImage = screen.getByAltText('サーバー点検システムロゴ');
    expect(logoImage).toBeInTheDocument();
    expect(logoImage).toHaveAttribute('src', '/images/logo.png');
    expect(logoImage).toHaveAttribute('height', '48');
    expect(logoImage).toHaveAttribute('width', '48');
    
    // サイトタイトルが存在することを確認
    expect(screen.getByText('サーバー点検システム')).toBeInTheDocument();
  });

  // ナビゲーションリンクが正しく表示されることをテスト
  it('renders navigation links correctly', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    // 「ホーム」リンクが存在することを確認
    const homeLink = screen.getByText('ホーム');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  // サイトタイトルがホームにリンクしていることをテスト
  it('links site title to home page', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    // サイトタイトルのリンクが正しいことを確認
    const titleLink = screen.getByText('サーバー点検システム').closest('a');
    expect(titleLink).toHaveAttribute('href', '/');
  });

  // ナビゲーションが適切に機能することをテスト
  it('navigates to home page when home link is clicked', () => {
    // モックコンポーネントを準備
    const MockHomePage = () => <div data-testid="home-page">Home Page</div>;
    const MockOtherPage = () => <div data-testid="other-page">Other Page</div>;
    
    render(
      <MemoryRouter initialEntries={['/other']}>
        <Header />
        <Routes>
          <Route path="/" element={<MockHomePage />} />
          <Route path="/other" element={<MockOtherPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    // 初期状態を確認
    expect(screen.getByTestId('other-page')).toBeInTheDocument();
    
    // ホームリンクをクリック
    fireEvent.click(screen.getByText('ホーム'));
    
    // ホームページに遷移したことを確認
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  // ハンバーガーメニューボタンの存在をテスト
  it('renders a hamburger menu button for mobile view', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    
    // ハンバーガーメニューボタンが存在することを確認
    const menuButton = screen.getByRole('button');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveClass('navbar-toggler');
    expect(menuButton).toHaveAttribute('data-bs-toggle', 'collapse');
    expect(menuButton).toHaveAttribute('data-bs-target', '#navbarNav');
    
    // ハンバーガーアイコンが存在することを確認
    const menuIcon = menuButton.querySelector('.navbar-toggler-icon');
    expect(menuIcon).toBeInTheDocument();
  });
});