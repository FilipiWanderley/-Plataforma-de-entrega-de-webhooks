import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent, 
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Chip
} from '@mui/material';
import { 
  ArrowLeft, 
  RotateCw, 
  Clock, 
  CheckCircle, 
  XCircle,
  Code,
  Calendar
} from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import StatusChip from '../components/common/StatusChip';
import CopyButton from '../components/common/CopyButton';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useToast } from '../contexts/ToastContext';
import { LoadingSkeleton } from '../components/common/DataState';

const DeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  const [delivery, setDelivery] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Replay State
  const [replayDialogOpen, setReplayDialogOpen] = useState(false);
  
  // Snippet Dialog State
  const [snippetDialogOpen, setSnippetDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deliveryRes, attemptsRes] = await Promise.all([
        api.get(`/deliveries/${id}`),
        api.get(`/deliveries/${id}/attempts`)
      ]);
      setDelivery(deliveryRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      console.error('Error fetching details:', error);
      toastError('Failed to load delivery details');
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async () => {
    try {
      await api.post(`/dlq/${id}/replay`);
      success('Replay initiated successfully');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error initiating replay:', error);
      toastError('Failed to initiate replay');
    } finally {
      setReplayDialogOpen(false);
    }
  };

  const openSnippet = (snippet) => {
    setSelectedSnippet(snippet);
    setSnippetDialogOpen(true);
  };

  if (loading) {
    return (
      <Box p={3}>
        <LoadingSkeleton rows={10} />
      </Box>
    );
  }

  if (!delivery) {
    return (
      <Box p={3}>
        <Typography variant="h6" color="error">Delivery not found</Typography>
        <Button startIcon={<ArrowLeft />} onClick={() => navigate('/deliveries')}>
          Back to List
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title={`Delivery ${delivery.id.substring(0, 8)}...`}
        subtitle="Delivery details and attempt history"
        action={
          <Button 
            variant="outlined" 
            startIcon={<ArrowLeft />} 
            onClick={() => navigate('/deliveries')}
          >
            Back
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Left Column: Details */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Overview</Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Delivery ID</Typography>
                  <Box mt={0.5} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', mr: 1 }}>
                      {delivery.id}
                    </Typography>
                    <CopyButton text={delivery.id} label="Copy Delivery ID" size="small" />
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Box mt={0.5}>
                    <StatusChip status={delivery.status} />
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">Endpoint</Typography>
                  <Typography variant="body1">{delivery.endpointName}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Created At</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Calendar size={16} className="text-gray-500" />
                    <Typography variant="body2">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">Attempts</Typography>
                  <Typography variant="body1">{delivery.attemptCount}</Typography>
                </Box>

                {delivery.nextAttemptAt && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">Next Attempt</Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Clock size={16} className="text-orange-500" />
                      <Typography variant="body2">
                        {new Date(delivery.nextAttemptAt).toLocaleString()}
                      </Typography>
                    </Stack>
                  </Box>
                )}

                {delivery.status === 'DLQ' && (
                  <Box mt={2}>
                    <Button 
                      variant="contained" 
                      color="warning" 
                      fullWidth
                      startIcon={<RotateCw />}
                      onClick={() => setReplayDialogOpen(true)}
                    >
                      Replay Delivery
                    </Button>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Timeline */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>Attempt History</Typography>
              {attempts.length === 0 ? (
                <Typography color="text.secondary">No attempts recorded yet.</Typography>
              ) : (
                <Stepper orientation="vertical" activeStep={-1}>
                  {attempts.map((attempt) => (
                    <Step key={attempt.id} expanded>
                      <StepLabel
                        icon={
                          attempt.success ? 
                            <CheckCircle size={20} color="green" /> : 
                            <XCircle size={20} color="red" />
                        }
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                          <Typography variant="subtitle2">
                            {attempt.success ? 'Success' : 'Failed'} ({attempt.responseCode})
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(attempt.createdAt).toLocaleString()}
                          </Typography>
                        </Stack>
                      </StepLabel>
                      <StepContent>
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" display="block" color="text.secondary">Duration</Typography>
                              <Typography variant="body2">{attempt.durationMs} ms</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" display="block" color="text.secondary">Response Code</Typography>
                              <Chip 
                                label={attempt.responseCode} 
                                size="small" 
                                color={attempt.success ? 'success' : 'error'} 
                                variant="outlined" 
                              />
                            </Grid>
                            
                            {attempt.errorMessage && (
                              <Grid item xs={12}>
                                <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
                                  Response / Error
                                </Typography>
                                <Box 
                                  sx={{ 
                                    maxHeight: 100, 
                                    overflow: 'hidden', 
                                    textOverflow: 'ellipsis',
                                    fontFamily: 'monospace',
                                    bgcolor: 'grey.100',
                                    p: 1,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    '&:hover': { bgcolor: 'grey.200' }
                                  }}
                                  onClick={() => openSnippet(attempt.errorMessage)}
                                >
                                  {attempt.errorMessage}
                                </Box>
                                <Button 
                                  size="small" 
                                  startIcon={<Code size={14} />} 
                                  onClick={() => openSnippet(attempt.errorMessage)}
                                  sx={{ mt: 1 }}
                                >
                                  View Full Snippet
                                </Button>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Replay Confirmation */}
      <ConfirmDialog
        open={replayDialogOpen}
        onClose={() => setReplayDialogOpen(false)}
        onConfirm={handleReplay}
        title="Replay Delivery"
        description="Are you sure you want to replay this delivery? This will create a new attempt."
        confirmText="Replay"
        confirmColor="warning"
      />

      {/* Snippet Dialog */}
      <Dialog 
        open={snippetDialogOpen} 
        onClose={() => setSnippetDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            Response Snippet
            <CopyButton text={selectedSnippet} label="Copy Snippet" />
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Paper 
            variant="outlined" 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.50', 
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              maxHeight: '60vh',
              overflow: 'auto'
            }}
          >
            {selectedSnippet}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSnippetDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DeliveryDetail;
