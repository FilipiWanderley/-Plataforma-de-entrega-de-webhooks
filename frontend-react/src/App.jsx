import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import EndpointList from './pages/EndpointList';
import EndpointForm from './pages/EndpointForm';
import DeliveryList from './pages/DeliveryList';
import DeliveryDetail from './pages/DeliveryDetail';
import TestEvent from './pages/TestEvent';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  
  return children;
};

function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/endpoints" replace />} />
          
          <Route path="endpoints" element={<EndpointList />} />
          <Route path="endpoints/new" element={<EndpointForm />} />
          <Route path="endpoints/:id/edit" element={<EndpointForm />} />
          
          <Route path="deliveries" element={<DeliveryList />} />
          <Route path="deliveries/:id" element={<DeliveryDetail />} />
          
          <Route path="test-event" element={<TestEvent />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}

export default App;
