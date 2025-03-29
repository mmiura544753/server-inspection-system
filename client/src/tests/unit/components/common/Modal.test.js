import React from 'react';
import { render, screen, fireEvent } from '../../../utils/test-utils';
import Modal from '../../../../components/common/Modal';

describe('Modal Component', () => {
  // モーダルの基本レンダリングをテスト
  it('renders nothing when show is false', () => {
    render(
      <Modal 
        show={false} 
        title="テストモーダル"
        onClose={() => {}}
      >
        <p>モーダルの内容</p>
      </Modal>
    );
    
    expect(screen.queryByText('テストモーダル')).not.toBeInTheDocument();
    expect(screen.queryByText('モーダルの内容')).not.toBeInTheDocument();
  });

  it('renders modal with title and content when show is true', () => {
    render(
      <Modal 
        show={true} 
        title="テストモーダル"
        onClose={() => {}}
      >
        <p>モーダルの内容</p>
      </Modal>
    );
    
    expect(screen.getByText('テストモーダル')).toBeInTheDocument();
    expect(screen.getByText('モーダルの内容')).toBeInTheDocument();
    
    // モーダルの基本構造を確認
    expect(screen.getByText('テストモーダル')).toBeInTheDocument();
    expect(screen.getByText('キャンセル')).toBeInTheDocument();
  });

  // 閉じるボタンの動作をテスト
  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    
    render(
      <Modal 
        show={true} 
        title="テストモーダル"
        onClose={handleClose}
      >
        <p>モーダルの内容</p>
      </Modal>
    );
    
    // 右上の閉じるボタンをクリック
    fireEvent.click(screen.getByLabelText('Close'));
    expect(handleClose).toHaveBeenCalledTimes(1);
    
    // キャンセルボタンをクリック
    fireEvent.click(screen.getByText('キャンセル'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  // 確認ボタンをテスト
  it('renders and handles confirm button when onConfirm is provided', () => {
    const handleConfirm = jest.fn();
    
    render(
      <Modal 
        show={true} 
        title="テストモーダル"
        onClose={() => {}}
        onConfirm={handleConfirm}
      >
        <p>確認モーダル</p>
      </Modal>
    );
    
    // 確認ボタンが表示されていることを確認
    const confirmButton = screen.getByText('確認');
    expect(confirmButton).toBeInTheDocument();
    
    // 確認ボタンをクリック
    fireEvent.click(confirmButton);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  // 完了ボタンをテスト
  it('renders complete button and hides cancel button when configured', () => {
    const handleClose = jest.fn();
    
    render(
      <Modal 
        show={true} 
        title="完了モーダル"
        onClose={handleClose}
        showCompleteButton={true}
        showCancelButton={false}
      >
        <p>操作完了</p>
      </Modal>
    );
    
    // 完了ボタンが表示されていることを確認
    const completeButton = screen.getByText('完了');
    expect(completeButton).toBeInTheDocument();
    
    // キャンセルボタンが非表示になっていることを確認
    expect(screen.queryByText('キャンセル')).not.toBeInTheDocument();
    
    // 完了ボタンをクリック
    fireEvent.click(completeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  // useEffectの動作をテスト
  it('disables body scroll when modal is shown', () => {
    const { unmount } = render(
      <Modal 
        show={true} 
        title="テストモーダル"
        onClose={() => {}}
      >
        <p>モーダルの内容</p>
      </Modal>
    );
    
    // bodyのoverflowスタイルがhiddenに設定されていることを確認
    expect(document.body.style.overflow).toBe('hidden');
    
    // コンポーネントのアンマウント時に元に戻ることを確認
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});