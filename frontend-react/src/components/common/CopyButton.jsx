import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const CopyButton = ({ text, label = 'Copy', size = 'small' }) => {
  const { success } = useToast();

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    success(`${label} copied to clipboard`);
  };

  return (
    <Tooltip title={label}>
      <IconButton onClick={handleCopy} size={size} aria-label={label}>
        <Copy size={16} />
      </IconButton>
    </Tooltip>
  );
};

export default CopyButton;