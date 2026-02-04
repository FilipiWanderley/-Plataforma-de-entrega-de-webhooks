-- Tenant Default
INSERT INTO tenants (id, name, status)
VALUES ('11111111-1111-1111-1111-111111111111', 'Default Tenant', 'ACTIVE');

-- Password is 'password' hashed with BCrypt
-- $2a$10$wS9y3... is generated for 'password'
INSERT INTO users (tenant_id, email, password_hash, role)
VALUES
('11111111-1111-1111-1111-111111111111', 'dev@local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'DEV'),
('11111111-1111-1111-1111-111111111111', 'ops@local', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', 'OPS');
