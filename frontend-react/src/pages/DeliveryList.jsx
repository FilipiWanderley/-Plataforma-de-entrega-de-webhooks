import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { Eye, RotateCw } from 'lucide-react';
import './DeliveryList.css';

const DeliveryList = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/deliveries', { params });
      setDeliveries(response.data.content || []);
    } catch (error) {
      console.error('Error fetching deliveries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = async (id) => {
    if (!window.confirm('Replay this delivery?')) return;
    try {
      await api.post(`/dlq/${id}/replay`);
      fetchDeliveries();
    } catch (error) {
      console.error('Error replaying:', error);
      alert('Replay failed');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Deliveries</h1>
        <div className="filters">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SUCCEEDED">Succeeded</option>
            <option value="FAILED">Failed</option>
            <option value="DLQ">DLQ</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Endpoint</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Next Attempt</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : deliveries.map((job) => (
              <tr key={job.id}>
                <td className="mono-font">{job.id.substring(0, 8)}...</td>
                <td>{job.endpointName}</td>
                <td>
                  <span className={`status-badge ${job.status?.toLowerCase()}`}>
                    {job.status}
                  </span>
                </td>
                <td>{job.attemptCount}</td>
                <td>{job.nextAttemptAt ? new Date(job.nextAttemptAt).toLocaleString() : '-'}</td>
                <td>{new Date(job.createdAt).toLocaleString()}</td>
                <td className="actions">
                  <Link to={`/deliveries/${job.id}`} className="btn-icon">
                    <Eye size={18} />
                  </Link>
                  {job.status === 'DLQ' && (
                    <button onClick={() => handleReplay(job.id)} className="btn-icon" title="Replay">
                      <RotateCw size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeliveryList;
