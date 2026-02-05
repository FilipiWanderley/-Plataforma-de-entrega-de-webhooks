import React from 'react';
import { DataGrid, GridToolbarContainer, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { Box, Paper, LinearProgress, Button, Typography, Alert } from '@mui/material';
import { Refresh } from '@mui/icons-material';

// Custom Toolbar
function CustomToolbar({ children, showQuickFilter }) {
  return (
    <GridToolbarContainer sx={{ p: 2, display: 'flex', gap: 2, justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1 }}>
        {showQuickFilter && <GridToolbarQuickFilter variant="outlined" size="small" placeholder="Search..." />}
        {children}
      </Box>
    </GridToolbarContainer>
  );
}

// Loading Overlay
function CustomLoadingOverlay() {
  return <LinearProgress />;
}

// No Rows Overlay
function CustomNoRowsOverlay() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
      <Typography variant="h6" color="text.secondary">No records found</Typography>
      <Typography variant="body2" color="text.secondary">Try adjusting your filters.</Typography>
    </Box>
  );
}

export default function DataGridProLite({
  rows = [],
  columns,
  loading = false,
  error,
  onRetry,
  paginationModel,
  onPaginationChange,
  rowCount,
  toolbarActions,
  showQuickFilter = true,
  ...props
}) {
  if (error) {
    return (
      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: 400, justifyContent: 'center' }}>
        <Alert severity="error">Failed to load data.</Alert>
        {onRetry && <Button startIcon={<Refresh />} onClick={onRetry} variant="outlined">Retry</Button>}
      </Paper>
    );
  }

  // Determine if server-side
  const isServerSide = rowCount !== undefined;

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 1, borderRadius: 2 }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        rowCount={rowCount} // Only for server-side
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationChange}
        pageSizeOptions={[10, 25, 50]}
        paginationMode={isServerSide ? 'server' : 'client'}
        sortingMode={isServerSide ? 'server' : 'client'}
        filterMode={isServerSide ? 'server' : 'client'}
        disableRowSelectionOnClick
        autoHeight={rows.length < 10}
        initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
            ...props.initialState
        }}
        slots={{
          toolbar: (params) => <CustomToolbar {...params} showQuickFilter={showQuickFilter}>{toolbarActions}</CustomToolbar>,
          loadingOverlay: CustomLoadingOverlay,
          noRowsOverlay: CustomNoRowsOverlay,
        }}
        sx={{
          border: 0,
          minHeight: 400,
          '& .MuiDataGrid-cell:focus': { outline: 'none' },
          '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
          ...props.sx
        }}
        {...props}
      />
    </Paper>
  );
}
