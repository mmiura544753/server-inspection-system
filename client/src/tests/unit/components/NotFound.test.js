import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFound from '../../../components/NotFound';

// react-router-domのLinkコンポーネントをモック
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => (
    <a href={to} data-testid="mock-link">
      {children}
    </a>
  ),
}));

describe('NotFound Component', () => {
  it('renders the 404 message', () => {
    render(<NotFound />);
    
    const headingElement = screen.getByText('404');
    expect(headingElement).toBeInTheDocument();
  });

  it('renders the not found message', () => {
    render(<NotFound />);
    
    const messageElement = screen.getByText('ページが見つかりません');
    expect(messageElement).toBeInTheDocument();
  });

  it('renders the explanation text', () => {
    render(<NotFound />);
    
    const explanationText = screen.getByText(/アクセスしようとしたページは存在しないか、移動した可能性があります/);
    expect(explanationText).toBeInTheDocument();
  });

  it('renders a link to home page', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByTestId('mock-link');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
    expect(homeLink).toHaveTextContent('ホームに戻る');
  });
});