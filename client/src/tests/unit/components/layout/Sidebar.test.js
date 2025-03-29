import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from '../../../../components/layout/Sidebar';

describe('Sidebar Component', () => {
  // 基本レンダリングをテスト
  it('renders all navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    
    // 全てのナビゲーションリンクが存在することを確認
    expect(screen.getByText('点検作業')).toBeInTheDocument();
    expect(screen.getByText('点検結果管理')).toBeInTheDocument();
    expect(screen.getByText('点検項目管理')).toBeInTheDocument();
    expect(screen.getByText('確認作業項目マスタ')).toBeInTheDocument();
    expect(screen.getByText('機器管理')).toBeInTheDocument();
    expect(screen.getByText('顧客管理')).toBeInTheDocument();
    expect(screen.getByText('レポート')).toBeInTheDocument();
  });

  // リンクのhref属性が正しいことを確認
  it('has correct href attributes for all links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    
    // 各リンクのhref属性を確認
    expect(screen.getByText('点検作業').closest('a')).toHaveAttribute('href', '/inspections/new');
    expect(screen.getByText('点検結果管理').closest('a')).toHaveAttribute('href', '/inspections');
    expect(screen.getByText('点検項目管理').closest('a')).toHaveAttribute('href', '/inspection-items');
    expect(screen.getByText('確認作業項目マスタ').closest('a')).toHaveAttribute('href', '/inspection-item-names');
    expect(screen.getByText('機器管理').closest('a')).toHaveAttribute('href', '/devices');
    expect(screen.getByText('顧客管理').closest('a')).toHaveAttribute('href', '/customers');
    expect(screen.getByText('レポート').closest('a')).toHaveAttribute('href', '/reports');
  });

  // アクティブなリンクにsidebar-activeクラスが付与されることを確認
  it('applies the active class to the current route', () => {
    const mockContent = () => <div>Mock Content</div>;
    
    render(
      <MemoryRouter initialEntries={['/customers']}>
        <Sidebar />
        <Routes>
          <Route path="/customers" element={mockContent()} />
        </Routes>
      </MemoryRouter>
    );
    
    // 顧客管理リンクにsidebar-activeクラスが付与されていることを確認
    const customersLink = screen.getByText('顧客管理').closest('a');
    expect(customersLink).toHaveClass('sidebar-active');
    
    // 他のリンクにはアクティブクラスが付与されていないことを確認
    const devicesLink = screen.getByText('機器管理').closest('a');
    expect(devicesLink).not.toHaveClass('sidebar-active');
  });

  // 別のルートへのナビゲーションをテスト
  it('navigates to the correct route when a link is clicked', () => {
    // 各ルート用のモックコンテンツを準備
    const MockInspections = () => <div data-testid="inspections-page">Inspections Page</div>;
    const MockDevices = () => <div data-testid="devices-page">Devices Page</div>;
    
    render(
      <MemoryRouter initialEntries={['/inspections']}>
        <Sidebar />
        <Routes>
          <Route path="/inspections" element={<MockInspections />} />
          <Route path="/devices" element={<MockDevices />} />
        </Routes>
      </MemoryRouter>
    );
    
    // 初期状態を確認
    expect(screen.getByTestId('inspections-page')).toBeInTheDocument();
    
    // 機器管理リンクをクリック
    fireEvent.click(screen.getByText('機器管理'));
    
    // 機器管理ページに遷移したことを確認
    expect(screen.getByTestId('devices-page')).toBeInTheDocument();
  });

  // アイコンが表示されているかテスト
  it('renders icons for each navigation link', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    
    // 各ナビゲーションアイテムに少なくとも1つのSVGアイコンが存在することを確認
    const navItems = screen.getAllByRole('listitem');
    navItems.forEach(item => {
      const svg = item.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });
});