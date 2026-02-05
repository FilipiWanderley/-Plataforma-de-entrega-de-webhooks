import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';

const PageHeader = ({ title, subtitle, action, actionLabel, actionIcon, onAction }) => {
  return (
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {(action || (actionLabel && onAction)) && (
        <Box>
          {action ? action : (
            <Button
              variant="contained"
              startIcon={actionIcon}
              onClick={onAction}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
};

export default PageHeader;
