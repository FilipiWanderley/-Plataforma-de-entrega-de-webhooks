import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import api from '../api/client';
import { 
  Box, 
  Button, 
  Grid, 
  TextField, 
  MenuItem, 
  Typography,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import PageHeader from '../components/common/PageHeader';
import CardSection from '../components/common/CardSection';
import { useToast } from '../contexts/ToastContext';

const EndpointForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [showSecret, setShowSecret] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (id) {
      fetchEndpoint();
    }
  }, [id]);

  const fetchEndpoint = async () => {
    try {
      const response = await api.get(`/endpoints/${id}`);
      reset(response.data);
    } catch (error) {
      console.error('Error fetching endpoint:', error);
      toastError('Failed to load endpoint details');
      navigate('/endpoints');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // For update, only include secret if provided
      if (id && !data.secret) {
        delete data.secret;
      }

      if (id) {
        await api.put(`/endpoints/${id}`, data);
        success('Endpoint updated successfully');
      } else {
        await api.post('/endpoints', data);
        success('Endpoint created successfully');
      }
      navigate('/endpoints');
    } catch (error) {
      console.error('Error saving endpoint:', error);
      toastError('Failed to save endpoint');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader 
        title={id ? 'Edit Endpoint' : 'New Endpoint'} 
        subtitle={id ? 'Update endpoint configuration' : 'Configure a new webhook endpoint'}
        action={
          <Button 
            component={RouterLink} 
            to="/endpoints" 
            startIcon={<ArrowLeft size={20} />}
            sx={{ textTransform: 'none' }}
          >
            Back to List
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <CardSection title="General Information">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Name / Description"
                    fullWidth
                    placeholder="e.g. Order Created Webhook"
                    {...register('name', { required: 'Name is required' })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Target URL"
                    fullWidth
                    placeholder="https://api.example.com/webhooks/orders"
                    {...register('url', { 
                      required: 'URL is required',
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'Must be a valid URL starting with http:// or https://'
                      }
                    })}
                    error={!!errors.url}
                    helperText={errors.url?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label={id ? "Signing Secret (Leave empty to keep current)" : "Signing Secret"}
                    fullWidth
                    type={showSecret ? "text" : "password"}
                    placeholder="e.g. whsec_..."
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowSecret(!showSecret)}
                            edge="end"
                          >
                            {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    {...register('secret', { 
                      required: !id && 'Secret is required' 
                    })}
                    error={!!errors.secret}
                    helperText={errors.secret?.message || "Used to sign webhook payloads (HMAC-SHA256)"}
                  />
                </Grid>
                {id && (
                  <Grid item xs={12}>
                    <TextField
                      select
                      label="Status"
                      fullWidth
                      defaultValue="ACTIVE"
                      {...register('status')}
                    >
                      <MenuItem value="ACTIVE">Active</MenuItem>
                      <MenuItem value="PAUSED">Paused</MenuItem>
                    </TextField>
                  </Grid>
                )}
              </Grid>
            </CardSection>
          </Grid>

          <Grid item xs={12} md={4}>
            <CardSection title="Reliability Settings">
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Max Retries"
                    type="number"
                    fullWidth
                    defaultValue={3}
                    {...register('maxAttempts', { 
                      required: 'Required', 
                      min: { value: 1, message: 'Min 1' }, 
                      max: { value: 20, message: 'Max 20' } 
                    })}
                    error={!!errors.maxAttempts}
                    helperText={errors.maxAttempts?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Timeout (ms)"
                    type="number"
                    fullWidth
                    defaultValue={5000}
                    {...register('timeoutMs', { 
                      required: 'Required', 
                      min: { value: 100, message: 'Min 100ms' }, 
                      max: { value: 60000, message: 'Max 60s' } 
                    })}
                    error={!!errors.timeoutMs}
                    helperText={errors.timeoutMs?.message}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Concurrency Limit"
                    type="number"
                    fullWidth
                    defaultValue={5}
                    {...register('concurrencyLimit', { 
                      required: 'Required', 
                      min: { value: 1, message: 'Min 1' }, 
                      max: { value: 100, message: 'Max 100' } 
                    })}
                    error={!!errors.concurrencyLimit}
                    helperText={errors.concurrencyLimit?.message || "Max concurrent requests"}
                  />
                </Grid>
              </Grid>
            </CardSection>

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={<Save size={20} />}
                sx={{ borderRadius: 2 }}
              >
                {loading ? 'Saving...' : 'Save Endpoint'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default EndpointForm;
