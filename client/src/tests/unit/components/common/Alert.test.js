import React from 'react';
import { render, screen } from '../../../utils/test-utils';
import Alert from '../../../../components/common/Alert';

describe('Alert Component', () => {
  it('renders an info alert message', () => {
    render(<Alert message="テスト情報メッセージ" />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-info');
    expect(alertElement).toHaveTextContent('テスト情報メッセージ');
  });

  it('renders a success alert message', () => {
    render(<Alert type="success" message="テスト成功メッセージ" />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-success');
    expect(alertElement).toHaveTextContent('テスト成功メッセージ');
  });

  it('renders a danger alert message', () => {
    render(<Alert type="danger" message="テストエラーメッセージ" />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-danger');
    expect(alertElement).toHaveTextContent('テストエラーメッセージ');
  });

  it('renders a warning alert message', () => {
    render(<Alert type="warning" message="テスト警告メッセージ" />);
    
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(alertElement).toHaveClass('alert-warning');
    expect(alertElement).toHaveTextContent('テスト警告メッセージ');
  });

  it('does not render when message is null or empty', () => {
    const { container } = render(<Alert message={null} />);
    expect(container.firstChild).toBeNull();
    
    const { container: emptyContainer } = render(<Alert message="" />);
    expect(emptyContainer.firstChild).toBeNull();
  });
});