import React from 'react';
import { Box, CircularProgress, Typography, Button, Skeleton, Stack } from '@mui/material';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const LoadingSkeleton = ({ rows = 3, height = 40 }) => (
  <Stack spacing={2}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
    ))}
  </Stack>
);

export const EmptyState = ({ title = 'No data found', description, action }) => (
  <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
        {description}
      </Typography>
    )}
    {action}
  </Box>
);

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <Box sx={{ py: 6, textAlign: 'center', color: 'error.main' }}>
    <AlertCircle size={48} style={{ marginBottom: 16, opacity: 0.8 }} />
    <Typography variant="h6" gutterBottom color="text.primary">
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
      {message || 'An unexpected error occurred. Please try again.'}
    </Typography>
    {onRetry && (
      <Button
        variant="outlined"
        color="primary"
        startIcon={<RefreshCw size={16} />}
        onClick={onRetry}
      >
        Retry
      </Button>
    )}
  </Box>
);
