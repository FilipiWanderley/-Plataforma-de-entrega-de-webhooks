import React from 'react';
import { Box, Typography } from '@mui/material';
import CopyButton from './CopyButton';

export default function CopyCell({ value, label = 'Copy' }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          fontFamily: 'monospace', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}
        title={value}
      >
        {value}
      </Typography>
      <CopyButton text={value} label={label} size="small" />
    </Box>
  );
}
