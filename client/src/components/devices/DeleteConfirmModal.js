// src/components/devices/DeleteConfirmModal.js
import React from 'react';
import Modal from '../common/Modal';

// 削除確認モーダルコンポーネント
const DeleteConfirmModal = ({ show, onClose, onConfirm, deviceToDelete }) => {
  return (
    <Modal
      show={show}
      onClose={onClose}
      title="機器削除の確認"
      onConfirm={onConfirm}
    >
      <p>機器「{deviceToDelete?.device_name}」を削除してもよろしいですか？</p>
      <p className="text-danger">
        削除すると、この機器に関連するすべての点検データも削除されます。
        この操作は元に戻せません。
      </p>
    </Modal>
  );
};

export default DeleteConfirmModal;
