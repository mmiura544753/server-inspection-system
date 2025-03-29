import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import Loading from '../../../../components/common/Loading';

describe('Loading Component', () => {
  it('renders loading spinner with text', () => {
    render(<Loading />);
    
    // スピナー要素を確認
    const spinnerElement = screen.getByRole('status');
    expect(spinnerElement).toBeInTheDocument();
    expect(spinnerElement).toHaveClass('spinner-border');
    
    // 表示テキストを確認（クラスで特定）
    const visibleText = screen.getByText('読み込み中...', { selector: '.ms-3' });
    expect(visibleText).toBeInTheDocument();
    
    // 非表示テキストも含まれているか確認
    const hiddenText = screen.getByText('読み込み中...', { selector: '.visually-hidden' });
    expect(hiddenText).toBeInTheDocument();
  });
  
  it('has the correct structure', () => {
    const { container } = render(<Loading />);
    
    // クラス名の確認
    expect(container.firstChild).toHaveClass('loading-spinner');
    
    // 子要素の構造を確認
    expect(container.querySelector('.spinner-border')).toBeInTheDocument();
    expect(container.querySelector('.ms-3')).toBeInTheDocument();
  });
});