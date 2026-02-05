import React, { useEffect, useState, useMemo } from 'react';
import api from '../../lib/client';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Plus, Send, Edit as EditIcon, Trash2, Pause, Play } from 'lucide-react';
import { 
  Box, 
  Button,
  FormControl,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import PageHeader from '../../ui/PageHeader';
import TestEventDialog from '../../ui/TestEventDialog';
import { useToast } from '../../app/providers/ToastContext';

// New DataGrid Components
import DataGridProLite from '../../ui/DataGrid/DataGridProLite';
import StatusChip from '../../ui/StatusChip';
import RowActionsMenu from '../../ui/RowActionsMenu';
import CopyCell from '../../ui/CopyCell';

const EndpointList = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Dialog State
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/endpoints');
      setEndpoints(response.data.content || response.data || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      setError('Failed to load endpoints');
      toastError('Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  const filteredEndpoints = useMemo(() => {
    if (statusFilter === 'ALL') return endpoints;
    return endpoints.filter(e => e.status === statusFilter);
  }, [endpoints, statusFilter]);

  const handleAction = (action, endpoint) => {
    switch (action) {
      case 'edit':
        navigate(`/endpoints/${endpoint.id}`);
        break;
      case 'test':
        setSelectedEndpoint(endpoint);
        setTestDialogOpen(true);
        break;
      case 'toggle_status':
        toggleStatus(endpoint);
        break;
      case 'delete':
        if (window.confirm('Are you sure you want to delete this endpoint?')) {
          deleteEndpoint(endpoint.id);
        }
        break;
      default:
        break;
    }
  };

  const toggleStatus = async (endpoint) => {
    try {
      const newStatus = endpoint.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      await api.put(`/endpoints/${endpoint.id}/status`, null, { params: { status: newStatus } });
      success(`Endpoint ${newStatus.toLowerCase()} successfully`);
      fetchEndpoints();
    } catch (error) {
      console.error('Error updating status:', error);
      toastError('Failed to update status');
    }
  };

  const deleteEndpoint = async (id) => {
    try {
      await api.delete(`/endpoints/${id}`);
      success('Endpoint deleted successfully');
      fetchEndpoints();
    } catch (error) {
      console.error('Error deleting endpoint:', error);
      toastError('Failed to delete endpoint');
    }
  };

  const columns = useMemo(() => [
    { 
      field: 'name', 
      headerName: 'Name', 
      flex: 1, 
      minWidth: 180,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
          <Typography variant="subtitle2" fontWeight={600}>{params.value}</Typography>
          {params.row.description && (
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.row.description}
            </Typography>
          )}
        </Box>
      )
    },
    { 
      field: 'url', 
      headerName: 'URL', 
      flex: 1.5, 
      minWidth: 250,
      renderCell: (params) => <CopyCell value={params.value} label="Copy URL" />
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value} />
    },
    {
      field: 'retryPolicy',
      headerName: 'Max Attempts',
      width: 130,
      valueGetter: (value, row) => row.maxAttempts || row.retryPolicy?.maxAttempts || 5,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value} attempts
        </Typography>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const isPaused = params.row.status === 'PAUSED';
        return (
          <RowActionsMenu actions={[
            { 
              label: 'Edit', 
              icon: <EditIcon size={18} />, 
              onClick: () => handleAction('edit', params.row) 
            },
            { 
              label: isPaused ? 'Resume' : 'Pause', 
              icon: isPaused ? <Play size={18} /> : <Pause size={18} />, 
              onClick: () => handleAction('toggle_status', params.row) 
            },
            { 
              label: 'Send Test Event', 
              icon: <Send size={18} />, 
              onClick: () => handleAction('test', params.row) 
            },
            { 
              label: 'Delete', 
              icon: <Trash2 size={18} />, 
              onClick: () => handleAction('delete', params.row),
              disabled: params.row.status === 'ACTIVE' 
            }
          ]} />
        );
      }
    }
  ], []);

  return (
    <Box>
      <PageHeader 
        title="Endpoints" 
        action={
          <Button 
            component={RouterLink} 
            to="/endpoints/new" 
            variant="contained" 
            startIcon={<Plus size={18} />}
          >
            Create Endpoint
          </Button>
        }
      />
      
      <DataGridProLite
        rows={filteredEndpoints}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={fetchEndpoints}
        toolbarActions={
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Filter by status' }}
              variant="outlined"
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PAUSED">Paused</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </Select>
          </FormControl>
        }
      />

      {testDialogOpen && selectedEndpoint && (
        <TestEventDialog
          open={testDialogOpen}
          onClose={() => {
            setTestDialogOpen(false);
            setSelectedEndpoint(null);
          }}
          endpoint={selectedEndpoint}
        />
      )}
    </Box>
  );
};

export default EndpointList;
