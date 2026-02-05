import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Edit } from 'lucide-react';
import './EndpointList.css';

const EndpointList = () => {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const fetchEndpoints = async () => {
    try {
      const response = await api.get('/endpoints');
      setEndpoints(response.data.content || []);
    } catch (error) {
      console.error('Error fetching endpoints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Endpoints</h1>
        <Link to="/endpoints/new" className="btn-primary">
          <Plus size={20} /> New Endpoint
        </Link>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>URL</th>
              <th>Events</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {endpoints.map((endpoint) => (
              <tr key={endpoint.id}>
                <td>{endpoint.description || 'No description'}</td>
                <td>{endpoint.url}</td>
                <td>{endpoint.eventTypes?.join(', ')}</td>
                <td>
                  <span className={`status-badge ${endpoint.status?.toLowerCase()}`}>
                    {endpoint.status}
                  </span>
                </td>
                <td className="actions">
                  <Link to={`/endpoints/${endpoint.id}/edit`} className="btn-icon">
                    <Edit size={18} />
                  </Link>
                  {/* Add delete/block if needed */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EndpointList;
