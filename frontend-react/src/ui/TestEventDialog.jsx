import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  Button, 
  Box, 
  Typography,
  CircularProgress
} from '@mui/material';
import { Send, Code } from 'lucide-react';
import api from '../lib/client';
import { useToast } from '../app/providers/ToastContext';

const TestEventDialog = ({ open, onClose }) => {
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let payload;
      try {
        payload = JSON.parse(data.payload);
      } catch (err) {
        console.error('JSON Parse Error:', err);
        error('Invalid JSON Payload');
        setLoading(false);
        return;
      }

      await api.post('/events', {
        eventType: data.eventType,
        payload: payload
      });

      success('Test event sent successfully');
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      error('Failed to send test event');
    } finally {
      setLoading(false);
    }
  };

  const loadExample = () => {
    setValue('eventType', 'ORDER_CREATED');
    setValue('payload', JSON.stringify({
      orderId: "12345",
      customer: "John Doe",
      amount: 99.99,
      items: [{ id: "p1", name: "Product A" }]
    }, null, 2));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Send size={20} /> Send Test Event
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Event Type"
              fullWidth
              placeholder="e.g. ORDER_CREATED"
              {...register('eventType', { required: 'Event Type is required' })}
              error={!!errors.eventType}
              helperText={errors.eventType?.message}
            />
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">Payload (JSON)</Typography>
                <Button 
                  size="small" 
                  startIcon={<Code size={14} />} 
                  onClick={loadExample}
                  sx={{ textTransform: 'none' }}
                >
                  Load Example
                </Button>
              </Box>
              <TextField
                multiline
                rows={8}
                fullWidth
                placeholder='{"key": "value"}'
                inputProps={{ style: { fontFamily: 'monospace' } }}
                {...register('payload', { required: 'Payload is required' })}
                error={!!errors.payload}
                helperText={errors.payload?.message}
                sx={{ bgcolor: 'grey.50' }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Send size={16} />}
          >
            Send Event
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default TestEventDialog;