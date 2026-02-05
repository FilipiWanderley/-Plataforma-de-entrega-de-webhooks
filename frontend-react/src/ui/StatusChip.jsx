import React from 'react';
import { Chip } from '@mui/material';

const STATUS_CONFIG = {
  active: { color: 'success', label: 'Active' },
  enabled: { color: 'success', label: 'Enabled' },
  paused: { color: 'warning', label: 'Paused' },
  disabled: { color: 'default', label: 'Disabled' },
  succeeded: { color: 'success', label: 'Succeeded' },
  failed: { color: 'error', label: 'Failed' },
  dlq: { color: 'error', label: 'DLQ' },
  retrying: { color: 'warning', label: 'Retrying' },
  pending: { color: 'info', label: 'Pending' },
  processing: { color: 'info', label: 'Processing' },
};

const StatusChip = ({ status, size = 'small' }) => {
  const normalizedStatus = status?.toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] || { color: 'default', label: status };

  return (
    <Chip
      label={config.label}
      color={config.color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusChip;
