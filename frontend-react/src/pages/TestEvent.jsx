import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/client';
import { Send, CheckCircle, AlertTriangle } from 'lucide-react';
import './TestEvent.css';

const TestEvent = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    try {
      let payload;
      try {
        payload = JSON.parse(data.payload);
      } catch (e) {
        alert('Invalid JSON Payload');
        setLoading(false);
        return;
      }

      const response = await api.post('/events', {
        eventType: data.eventType,
        payload: payload
      });

      setResult({
        success: true,
        message: `Event sent successfully! ID: ${response.data.id}`
      });
      // Optional: clear form
      // reset(); 
    } catch (error) {
      console.error('Error sending event:', error);
      setResult({
        success: false,
        message: 'Failed to send event. Check console for details.'
      });
    } finally {
      setLoading(false);
    }
  };

  const fillExample = () => {
    reset({
      eventType: 'ORDER_CREATED',
      payload: JSON.stringify({
        orderId: "12345",
        customer: "John Doe",
        amount: 99.99,
        items: [{ id: "p1", name: "Product A" }]
      }, null, 2)
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Send Test Event</h1>
      </div>

      <div className="test-event-container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Event Type</label>
            <input 
              {...register('eventType', { required: true })} 
              placeholder="e.g. ORDER_CREATED"
            />
            {errors.eventType && <span>Event Type is required</span>}
          </div>

          <div className="form-group">
            <label>Payload (JSON)</label>
            <textarea 
              {...register('payload', { required: true })} 
              rows={10}
              placeholder='{"key": "value"}'
            />
            {errors.payload && <span>Payload is required</span>}
          </div>

          <div className="form-actions">
            <button type="button" onClick={fillExample} className="btn-secondary">
              Load Example
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Sending...' : (
                <>
                  <Send size={18} /> Send Event
                </>
              )}
            </button>
          </div>
        </form>

        {result && (
          <div className={`result-box ${result.success ? 'success' : 'error'}`}>
            {result.success ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            <p>{result.message}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestEvent;
