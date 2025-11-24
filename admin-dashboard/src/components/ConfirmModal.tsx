import { useState, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    setIsVisible(false);
    setTimeout(() => {
      onConfirm();
    }, 150);
  };

  const handleCancel = () => {
    setIsVisible(false);
    setTimeout(() => {
      onCancel();
    }, 150);
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmColor: 'bg-red-600 hover:bg-red-700',
          borderColor: 'border-red-500'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmColor: 'bg-yellow-600 hover:bg-yellow-700',
          borderColor: 'border-yellow-500'
        };
      default:
        return {
          icon: 'ℹ️',
          confirmColor: 'bg-blue-600 hover:bg-blue-700',
          borderColor: 'border-blue-500'
        };
    }
  };

  const styles = getTypeStyles();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-150 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleCancel}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4
          border-2 ${styles.borderColor}
          transition-all duration-150 transform
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          </div>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${styles.confirmColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function for easy modal usage
export function useConfirm() {
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const confirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
      onCancel?: () => void;
    }
  ) => {
    return new Promise<boolean>((resolve) => {
      setModal({
        isOpen: true,
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        type: options?.type || 'info',
        onConfirm: () => {
          onConfirm();
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          options?.onCancel?.();
          setModal(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });
    });
  };

  const ConfirmComponent = () => {
    if (!modal.isOpen) return null;

    return (
      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        type={modal.type}
        onConfirm={modal.onConfirm || (() => {})}
        onCancel={modal.onCancel || (() => {})}
      />
    );
  };

  return { confirm, ConfirmComponent };
}