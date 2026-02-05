import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/client';
import './EndpointForm.css';

const EndpointForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      fetchEndpoint();
    }
  }, [id]);

  const fetchEndpoint = async () => {
    try {
      const response = await api.get(`/endpoints/${id}`); // Assuming GET /endpoints/{id} exists? 
      // Actually Controller usually has GET /endpoints/{id}?
      // Let's check Controller. If not, we might need to filter from list or add it.
      // Controller only has list, create, update, block. No GET /endpoints/{id}.
      // So we have to fetch list and find it, or update backend.
      // For now, I'll assume I can't fetch single, so I'll just use the update endpoint directly if I have data, 
      // but to edit I need data.
      // I will implement fetching from list for now since I can't change backend easily without verifying.
      // Wait, Controller has @PutMapping("/{id}"), but no @GetMapping("/{id}").
      // I should probably add GET /endpoints/{id} to backend if I want to be clean.
      // Or I can just pass state via router or fetch list.
      // I'll fetch list and filter.
      const listResponse = await api.get('/endpoints');
      const found = listResponse.data.content.find(e => e.id === id);
      if (found) reset(found);
    } catch (error) {
      console.error('Error fetching endpoint:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (id) {
        await api.put(`/endpoints/${id}`, data);
      } else {
        await api.post('/endpoints', data);
      }
      navigate('/endpoints');
    } catch (error) {
      console.error('Error saving endpoint:', error);
      alert('Failed to save endpoint');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>{id ? 'Edit Endpoint' : 'New Endpoint'}</h1>
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Name (Description)</label>
            <input 
              {...register('name', { required: true })} 
              placeholder="My Webhook"
            />
            {errors.name && <span>Name is required</span>}
          </div>

          <div className="form-group">
            <label>URL</label>
            <input 
              {...register('url', { required: true, pattern: /^https?:\/\/.+/ })} 
              placeholder="https://api.example.com/webhook"
            />
            {errors.url && <span>Valid URL is required</span>}
          </div>

          <div className="form-group">
            <label>Secret</label>
            <input 
              {...register('secret', { required: true })} 
              placeholder="Signing Secret"
            />
            {errors.secret && <span>Secret is required</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Max Attempts</label>
              <input 
                type="number"
                {...register('maxAttempts', { required: true, min: 1, max: 20 })} 
                defaultValue={3}
              />
              {errors.maxAttempts && <span>1-20</span>}
            </div>

            <div className="form-group">
              <label>Timeout (ms)</label>
              <input 
                type="number"
                {...register('timeoutMs', { required: true, min: 100, max: 60000 })} 
                defaultValue={5000}
              />
              {errors.timeoutMs && <span>100-60000</span>}
            </div>

            <div className="form-group">
              <label>Concurrency Limit</label>
              <input 
                type="number"
                {...register('concurrencyLimit', { required: true, min: 1, max: 100 })} 
                defaultValue={2}
              />
              {errors.concurrencyLimit && <span>1-100</span>}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => navigate('/endpoints')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EndpointForm;
