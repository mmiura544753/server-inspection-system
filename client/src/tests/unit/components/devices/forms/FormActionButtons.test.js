import React from 'react';
import { render, screen } from '../../../../utils/test-utils';
import { MemoryRouter } from 'react-router-dom';
import FormActionButtons from '../../../../../components/devices/forms/FormActionButtons';

describe('FormActionButtons Component', () => {
  it('renders cancel and save buttons', () => {
    render(
      <MemoryRouter>
        <FormActionButtons />
      </MemoryRouter>
    );
    
    // キャンセルボタンの確認
    const cancelButton = screen.getByText('キャンセル');
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton.closest('a')).toHaveAttribute('href', '/devices');
    
    // 保存ボタンの確認
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveTextContent('保存する');
    expect(saveButton).not.toBeDisabled();
  });
  
  it('shows loading state when isSubmitting is true', () => {
    render(
      <MemoryRouter>
        <FormActionButtons isSubmitting={true} />
      </MemoryRouter>
    );
    
    // 保存ボタンがローディング状態になっているか確認
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveTextContent('保存中...');
  });
  
  it('has correct button styling', () => {
    render(
      <MemoryRouter>
        <FormActionButtons />
      </MemoryRouter>
    );
    
    // キャンセルボタンのスタイル
    const cancelButton = screen.getByText('キャンセル').closest('a');
    expect(cancelButton).toHaveClass('btn');
    expect(cancelButton).toHaveClass('btn-secondary');
    
    // 保存ボタンのスタイル
    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toHaveClass('btn');
    expect(saveButton).toHaveClass('btn-primary');
  });
  
  it('has correct layout styling', () => {
    const { container } = render(
      <MemoryRouter>
        <FormActionButtons />
      </MemoryRouter>
    );
    
    // MemoryRouterがラッパーとして追加されるため、
    // 実際のコンポーネントはdiv[data-testid="test-wrapper"] > FormActionButtons
    const formActions = container.querySelector('.mt-4');
    expect(formActions).toHaveClass('mt-4');
    expect(formActions).toHaveClass('d-flex');
    expect(formActions).toHaveClass('justify-content-between');
  });
});