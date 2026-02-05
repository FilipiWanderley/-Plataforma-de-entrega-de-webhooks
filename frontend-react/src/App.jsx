import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './app/providers/AuthContext';
import { ToastProvider } from './app/providers/ToastContext';
import Layout from './app/Layout';
import Login from './features/auth/Login';
import EndpointList from './features/endpoint/EndpointList';
import EndpointForm from './features/endpoint/EndpointForm';
import DeliveryList from './features/delivery/DeliveryList';
import DeliveryDetail from './features/delivery/DeliveryDetail';
import TestEvent from './features/testing/TestEvent';

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
