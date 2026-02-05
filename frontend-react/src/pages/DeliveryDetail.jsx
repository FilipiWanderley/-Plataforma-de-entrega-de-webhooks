import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { ArrowLeft, RotateCw } from 'lucide-react';
import './DeliveryDetail.css';

const DeliveryDetail = () => {
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttempts();
  }, [id]);

  const fetchAttempts = async () => {
    try {
      const response = await api.get(`/deliveries/${id}/attempts`);
      setAttempts(response.data);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-left">
          <Link to="/deliveries" className="back-link">
            <ArrowLeft size={20} />
          </Link>
          <h1>Delivery Details</h1>
        </div>
      </div>

      <div className="attempts-list">
        <h3>Attempts History</h3>
        {loading ? (
          <div>Loading...</div>
        ) : attempts.length === 0 ? (
          <div className="empty-state">No attempts recorded yet.</div>
        ) : (
          attempts.map((attempt) => (
            <div key={attempt.id} className={`attempt-card ${attempt.success ? 'success' : 'failure'}`}>
              <div className="attempt-header">
                <span className="status-indicator">
                  {attempt.success ? 'Success' : 'Failure'}
                </span>
                <span className="timestamp">
                  {new Date(attempt.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="attempt-details">
                <div className="detail-item">
                  <span className="label">Response Code:</span>
                  <span className="value">{attempt.responseCode}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">{attempt.durationMs} ms</span>
                </div>
                {attempt.errorMessage && (
                  <div className="detail-item full-width">
                    <span className="label">Error:</span>
                    <pre className="error-text">{attempt.errorMessage}</pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DeliveryDetail;
