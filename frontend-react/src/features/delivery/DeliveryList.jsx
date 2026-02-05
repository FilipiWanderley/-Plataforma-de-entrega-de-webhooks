import React, { useEffect, useState, useMemo } from 'react';
import api from '../../lib/client';
import { useNavigate } from 'react-router-dom';
import { Eye, RotateCw } from 'lucide-react';
import { Box, FormControl, Select, MenuItem, Typography } from '@mui/material';
import PageHeader from '../../ui/PageHeader';
import { useToast } from '../../app/providers/ToastContext';
import { format } from 'date-fns';

import DataGridProLite from '../../ui/DataGrid/DataGridProLite';
import StatusChip from '../../ui/StatusChip';
import RowActionsMenu from '../../ui/RowActionsMenu';
import CopyCell from '../../ui/CopyCell';
import ConfirmDialog from '../../ui/ConfirmDialog';

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalElements, setTotalElements] = useState(0);

  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);

  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter, paginationModel]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page,
        size: paginationModel.pageSize,
        sort: 'createdAt,desc'
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      
      const response = await api.get('/deliveries', { params });
      setDeliveries(response.data.content || []);
      setTotalElements(response.data.totalElements || 0);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toastError('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action, row) => {
    switch (action) {
      case 'view':
        navigate(`/deliveries/${row.id}`);
        break;
      case 'replay':
        setSelectedDeliveryId(row.id);
        setReplayDialogOpen(true);
        break;
      default:
        break;
    }
  };

  const handleReplayConfirm = async () => {
    try {
      await api.post(`/dlq/${selectedDeliveryId}/replay`);
      success('Delivery replay initiated');
      fetchDeliveries();
    } catch (error) {
      console.error('Error replaying:', error);
      toastError('Replay failed');
    } finally {
      setReplayDialogOpen(false);
      setSelectedDeliveryId(null);
    }
  };

  const columns = useMemo(() => [
    { 
      field: 'id', 
      headerName: 'Delivery ID', 
      width: 220,
      renderCell: (params) => <CopyCell value={params.value} label="Copy ID" />
    },
    { 
      field: 'endpointId', 
      headerName: 'Endpoint', 
      flex: 1, 
      minWidth: 200,
      renderCell: (params) => (
        <Box>
            <Typography variant="body2">{params.row.endpointName || params.value}</Typography>
        </Box>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120, 
      renderCell: (params) => <StatusChip status={params.value} /> 
    },
    { 
      field: 'attemptCount', 
      headerName: 'Attempts', 
      width: 100,
      align: 'center',
      headerAlign: 'center'
    },
    { 
      field: 'createdAt', 
      headerName: 'Created At', 
      width: 180,
      valueFormatter: (params) => params.value ? format(new Date(params.value), 'yyyy-MM-dd HH:mm:ss') : '-'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <RowActionsMenu actions={[
          { label: 'View Details', icon: <Eye size={18} />, onClick: () => handleAction('view', params.row) },
          { label: 'Replay', icon: <RotateCw size={18} />, onClick: () => handleAction('replay', params.row) }
        ]} />
      )
    }
  ], []);

  return (
    <Box>
      <PageHeader title="Deliveries" />
      
      <DataGridProLite
        rows={deliveries}
        columns={columns}
        loading={loading}
        rowCount={totalElements}
        paginationModel={paginationModel}
        onPaginationChange={setPaginationModel}
        toolbarActions={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page on filter change
              }}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by status' }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="SUCCESS">Success</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="DLQ">DLQ</MenuItem>
            </Select>
          </FormControl>
        }
      />

      <ConfirmDialog
        open={replayDialogOpen}
        title="Replay Delivery"
        content="Are you sure you want to replay this delivery?"
        onConfirm={handleReplayConfirm}
        onClose={() => setReplayDialogOpen(false)}
      />
    </Box>
  );
};

export default DeliveryList;
