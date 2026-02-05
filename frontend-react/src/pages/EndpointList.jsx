import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Plus, MoreVertical, Send, Eye, Edit as EditIcon, Trash2 } from 'lucide-react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  Button,
  TextField,
  MenuItem,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import CardSection from '../components/common/CardSection';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/DataState';
import StatusChip from '../components/common/StatusChip';
import CopyButton from '../components/common/CopyButton';
import TestEventDialog from '../components/common/TestEventDialog';
import { useToast } from '../contexts/ToastContext';

const EndpointList = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [filteredEndpoints, setFilteredEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    filterEndpoints();
  }, [search, statusFilter, endpoints]);

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/endpoints');
      setEndpoints(response.data.content || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
      setError('Failed to load endpoints');
      toastError('Failed to load endpoints');
    } finally {
      setLoading(false);
    }
  };

  const filterEndpoints = () => {
    let result = endpoints;
    
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(e => 
        (e.name || '').toLowerCase().includes(lowerSearch) || 
        (e.description || '').toLowerCase().includes(lowerSearch) ||
        (e.url || '').toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'ALL') {
      result = result.filter(e => e.status === statusFilter);
    }

    setFilteredEndpoints(result);
  };

  const handleMenuOpen = (event, endpoint) => {
    setAnchorEl(event.currentTarget);
    setSelectedEndpoint(endpoint);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEndpoint(null);
  };

  const handleAction = (action) => {
    if (!selectedEndpoint) return;
    
    switch (action) {
      case 'edit':
        navigate(`/endpoints/${selectedEndpoint.id}/edit`);
        break;
      case 'deliveries':
        navigate(`/deliveries?endpointId=${selectedEndpoint.id}`); // Assuming DeliveryList supports this
        break;
      // Add delete or other actions here
    }
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box>
        <PageHeader 
          title="Endpoints" 
          subtitle="Manage your webhook endpoints"
        />
        <CardSection>
          <LoadingSkeleton rows={5} />
        </CardSection>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader title="Endpoints" />
        <CardSection>
          <ErrorState message={error} onRetry={fetchEndpoints} />
        </CardSection>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title="Endpoints" 
        subtitle="Manage your webhook endpoints"
        action={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Send size={18} />}
              onClick={() => setTestDialogOpen(true)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Test Event
            </Button>
            <Button 
              component={RouterLink} 
              to="/endpoints/new" 
              variant="contained" 
              startIcon={<Plus size={20} />}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              New Endpoint
            </Button>
          </Stack>
        }
      />

      <CardSection title="Endpoints" action={
        <Button 
          variant="contained" 
          startIcon={<Plus size={20} />}
          component={RouterLink}
          to="/endpoints/new"
        >
          New Endpoint
        </Button>
      }>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search endpoints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flexGrow: 1 }}
            />
            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PAUSED">Paused</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
            </TextField>
          </Stack>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
          <Table stickyHeader sx={{ minWidth: 650 }} aria-label="endpoints table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name / ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Config</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEndpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <EmptyState 
                      title={endpoints.length === 0 ? "No endpoints found" : "No matching endpoints"}
                      description={endpoints.length === 0 ? "Get started by creating your first webhook endpoint." : "Try adjusting your filters."}
                      action={endpoints.length === 0 && (
                        <Button 
                          component={RouterLink} 
                          to="/endpoints/new" 
                          variant="contained" 
                          size="small"
                          startIcon={<Plus size={16} />}
                          sx={{ mt: 2 }}
                        >
                          Create Endpoint
                        </Button>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredEndpoints.map((endpoint) => (
                  <TableRow
                    key={endpoint.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    hover
                  >
                    <TableCell component="th" scope="row">
                      <Box sx={{ fontWeight: 'medium' }}>{endpoint.name || endpoint.description || 'Unnamed'}</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.75rem', mt: 0.5 }}>
                        {endpoint.id.substring(0, 8)}...
                        <CopyButton text={endpoint.id} label="Copy ID" size="small" />
                      </Box>
                      {endpoint.description && endpoint.name && (
                        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{endpoint.description}</Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {endpoint.url}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={endpoint.status} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontSize: '0.875rem' }}>
                        Timeout: {endpoint.timeoutMs}ms
                        <br />
                        Attempts: {endpoint.maxAttempts}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        onClick={(e) => handleMenuOpen(e, endpoint)}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardSection>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleAction('edit')}>
          <ListItemIcon><EditIcon size={18} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction('deliveries')}>
          <ListItemIcon><Eye size={18} /></ListItemIcon>
          <ListItemText>View Deliveries</ListItemText>
        </MenuItem>
      </Menu>

      <TestEventDialog 
        open={testDialogOpen} 
        onClose={() => setTestDialogOpen(false)} 
      />
    </Box>
  );
};

export default EndpointList;
