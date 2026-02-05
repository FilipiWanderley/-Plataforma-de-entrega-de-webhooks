import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import api from '../../lib/client';
import { Send, Code, RotateCcw } from 'lucide-react';
import { 
  Box, 
  Grid, 
  TextField, 
  Button, 
  Alert,
  AlertTitle,
  Stack,
  Typography
} from '@mui/material';
import PageHeader from '../../ui/PageHeader';
import CardSection from '../../ui/CardSection';
import { useToast } from '../../app/providers/ToastContext';

const TestEvent = () => {
  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      eventType: '',
      payload: ''
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const { success, error: toastError } = useToast();

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      let payloadJson;
      try {
        payloadJson = JSON.parse(data.payload);
      } catch (error) {
        console.error('JSON Parse Error:', error);
        toastError('Invalid JSON Payload');
        setLoading(false);
        return;
      }

      const response = await api.post('/events', {
        eventType: data.eventType,
        payload: payloadJson
      });

      setResult({
        success: true,
        message: `Event sent successfully!`,
        id: response.data.id
      });
      success('Event broadcasted to active endpoints');
    } catch (error) {
      console.error('Error sending event:', error);
      setResult({
        success: false,
        message: 'Failed to send event.'
      });
      toastError('Failed to send event');
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    setValue('eventType', 'ORDER_CREATED');
    setValue('payload', JSON.stringify({
      orderId: "12345",
      customer: "John Doe",
      amount: 99.99,
      items: [{ id: "p1", name: "Product A" }]
    }, null, 2));
  };

  return (
    <Box>
      <PageHeader 
        title="Send Test Event" 
        subtitle="Broadcast an event to all active endpoints"
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <CardSection title="Event Details">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={3}>
                <Controller
                  name="eventType"
                  control={control}
                  rules={{ required: 'Event Type is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Event Type"
                      placeholder="e.g. ORDER_CREATED"
                      error={!!errors.eventType}
                      helperText={errors.eventType?.message}
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="payload"
                  control={control}
                  rules={{ required: 'Payload is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="JSON Payload"
                      multiline
                      rows={10}
                      placeholder='{"key": "value"}'
                      error={!!errors.payload}
                      helperText={errors.payload?.message}
                      fullWidth
                      sx={{ fontFamily: 'monospace' }}
                    />
                  )}
                />

                <Stack direction="row" spacing={2}>
                  <Button 
                    variant="contained" 
                    type="submit" 
                    startIcon={<Send size={18} />}
                    disabled={loading}
                    size="large"
                  >
                    {loading ? 'Sending...' : 'Send Event'}
                  </Button>
                  <Button 
                    variant="outlined" 
                    onClick={fillExample}
                    startIcon={<RotateCcw size={18} />}
                  >
                    Load Example
                  </Button>
                </Stack>
              </Stack>
            </form>
          </CardSection>

          {result && (
            <Box mt={3}>
              <Alert severity={result.success ? 'success' : 'error'}>
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
                {result.message}
                {result.id && (
                  <Typography variant="body2" sx={{ mt: 1, fontFamily: 'monospace' }}>
                    Event ID: {result.id}
                  </Typography>
                )}
              </Alert>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={4}>
          <Alert severity="info" icon={<Code />}>
            <AlertTitle>How it works</AlertTitle>
            This form simulates an event occurring in your system. 
            The event will be matched against all <strong>Active</strong> endpoints 
            configured for your tenant.
            <Box mt={2}>
              <strong>Note:</strong> Ensure you have at least one active endpoint to receive this event.
            </Box>
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TestEvent;
