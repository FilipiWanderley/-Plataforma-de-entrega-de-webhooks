import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link as RouterLink } from 'react-router-dom';
import { Plus, Edit } from 'lucide-react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import CardSection from '../components/common/CardSection';
import { LoadingSkeleton, EmptyState, ErrorState } from '../components/common/DataState';
import StatusChip from '../components/common/StatusChip';
import { useToast } from '../contexts/ToastContext';

const EndpointList = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: toastError } = useToast();

  useEffect(() => {
    fetchEndpoints();
  }, []);

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

  if (loading) {
    return (
      <Box>
        <PageHeader 
          title="Endpoints" 
          subtitle="Manage your webhook endpoints"
          actionLabel="New Endpoint"
          actionIcon={<Plus size={20} />}
          onAction={() => {}} // Placeholder or disabled
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
          <Button 
            component={RouterLink} 
            to="/endpoints/new" 
            variant="contained" 
            startIcon={<Plus size={20} />}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            New Endpoint
          </Button>
        }
      />

      <CardSection noPadding>
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="endpoints table">
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>URL</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Events</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {endpoints.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <EmptyState 
                      title="No endpoints found" 
                      description="Get started by creating your first webhook endpoint."
                      action={
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
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                endpoints.map((endpoint) => (
                  <TableRow
                    key={endpoint.id}
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      {endpoint.description || 'No description'}
                    </TableCell>
                    <TableCell>{endpoint.url}</TableCell>
                    <TableCell>{endpoint.eventTypes?.join(', ')}</TableCell>
                    <TableCell>
                      <StatusChip status={endpoint.status} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton 
                        component={RouterLink} 
                        to={`/endpoints/${endpoint.id}/edit`} 
                        size="small" 
                        color="primary"
                      >
                        <Edit size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardSection>
    </Box>
  );
};

// Missing import fix
import { Button } from '@mui/material';

export default EndpointList;
