import React from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';

const CardSection = ({ title, action, children, noPadding = false }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden'
      }}
    >
      {(title || action) && (
        <>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {title && (
              <Typography variant="h6" fontWeight="bold">
                {title}
              </Typography>
            )}
            {action && <Box>{action}</Box>}
          </Box>
          <Divider />
        </>
      )}
      <Box sx={{ p: noPadding ? 0 : 3 }}>
        {children}
      </Box>
    </Paper>
  );
};

export default CardSection;
