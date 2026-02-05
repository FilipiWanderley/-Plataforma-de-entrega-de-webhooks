import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link as RouterLink } from 'react-router-dom';
import { Eye, RotateCw } from 'lucide-react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton,
  TextField,
  MenuItem,
  TablePagination,
  Stack,
  Tooltip
} from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import CardSection from '../components/common/CardSection';
import { LoadingSkeleton, EmptyState } from '../components/common/DataState';
import StatusChip from '../components/common/StatusChip';
import CopyButton from '../components/common/CopyButton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  
  // Replay Dialog State
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  
  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter, page, rowsPerPage]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = {
        page: page,
        size: rowsPerPage,
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

  const handleReplayClick = (id) => {
    setSelectedDeliveryId(id);
    setReplayDialogOpen(true);
  };

  const handleReplayConfirm = async () => {
    try {
      await api.post(`/dlq/${selectedDeliveryId}/replay`);
      success('Delivery replay initiated');
      fetchDeliveries(); // Refresh list
    } catch (error) {
      console.error('Error replaying:', error);
      toastError('Replay failed');
    } finally {
      setReplayDialogOpen(false);
      setSelectedDeliveryId(null);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <PageHeader 
        title="Deliveries" 
        subtitle="View and manage webhook delivery attempts"
      />

      <CardSection title="Deliveries">
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2}>
            <TextField
              select
              size="small"
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0); // Reset page on filter change
              }}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="PROCESSING">Processing</MenuItem>
              <MenuItem value="SUCCEEDED">Succeeded</MenuItem>
              <MenuItem value="FAILED">Failed</MenuItem>
              <MenuItem value="DLQ">DLQ (Dead Letter Queue)</MenuItem>
            </TextField>
          </Stack>
        </Box>

        {loading ? (
          <LoadingSkeleton rows={5} />
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
              <Table stickyHeader sx={{ minWidth: 650 }} aria-label="deliveries table">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'background.default' }}>
                    <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Endpoint</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Attempts</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Next Attempt</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <EmptyState 
                          title="No deliveries found" 
                          description="Adjust filters or wait for events."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((job) => (
                      <TableRow key={job.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {job.id.substring(0, 8)}...
                            <CopyButton text={job.id} label="Copy ID" size="small" />
                          </Box>
                        </TableCell>
                        <TableCell>{job.endpointName}</TableCell>
                        <TableCell>
                          <StatusChip status={job.status} />
                        </TableCell>
                        <TableCell>{job.attemptCount}</TableCell>
                        <TableCell>
                          {job.nextAttemptAt ? new Date(job.nextAttemptAt).toLocaleString() : '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(job.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="View Details">
                              <IconButton 
                                component={RouterLink} 
                                to={`/deliveries/${job.id}`} 
                                size="small"
                                color="primary"
                                aria-label="View Details"
                              >
                                <Eye size={18} />
                              </IconButton>
                            </Tooltip>
                            {job.status === 'DLQ' && (
                              <Tooltip title="Replay">
                                <IconButton 
                                  onClick={() => handleReplayClick(job.id)} 
                                  size="small"
                                  color="warning"
                                  aria-label="Replay"
                                >
                                  <RotateCw size={18} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={totalElements}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </CardSection>

      <ConfirmDialog
        open={replayDialogOpen}
        onClose={() => setReplayDialogOpen(false)}
        onConfirm={handleReplayConfirm}
        title="Replay Delivery"
        description="Are you sure you want to replay this delivery from the Dead Letter Queue?"
        confirmText="Replay"
        confirmColor="warning"
      />
    </Box>
  );
};

export default DeliveryList;
