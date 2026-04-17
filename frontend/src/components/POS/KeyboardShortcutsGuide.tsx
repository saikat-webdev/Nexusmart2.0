import React from 'react';

interface KeyboardShortcutsGuideProps {
  onClose: () => void;
}

const KeyboardShortcutsGuide: React.FC<KeyboardShortcutsGuideProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'F2', description: 'Focus product search' },
    { key: 'F9', description: 'Proceed to checkout' },
    { key: 'F10', description: 'Clear cart' },
    { key: 'Esc', description: 'Close dialogs' },
    { key: 'Ctrl + K', description: 'Focus customer search' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">⌨️ Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <span className="text-gray-700">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
