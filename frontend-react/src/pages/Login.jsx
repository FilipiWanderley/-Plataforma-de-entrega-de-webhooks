import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState('');

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password);
      navigate('/endpoints');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Webhook Platform</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input 
              {...register('email', { required: true })} 
              type="email" 
              placeholder="dev@local"
            />
            {errors.email && <span>Email is required</span>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              {...register('password', { required: true })} 
              type="password" 
              placeholder="password"
            />
            {errors.password && <span>Password is required</span>}
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
