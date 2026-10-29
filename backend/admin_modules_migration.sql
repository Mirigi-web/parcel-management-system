-- Run once against the same PostgreSQL database used by the backend.
-- This migration only adds tables for the four new admin modules.

CREATE TABLE IF NOT EXISTS system_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_name VARCHAR(160),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(80),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created ON system_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action ON system_audit_logs(action);

CREATE TABLE IF NOT EXISTS fleet_vehicles (
  id BIGSERIAL PRIMARY KEY,
  registration_number VARCHAR(40) NOT NULL UNIQUE,
  make_model VARCHAR(120) NOT NULL DEFAULT '',
  capacity_kg NUMERIC(12,2),
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available','on_route','maintenance','inactive')),
  driver_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (capacity_kg IS NULL OR capacity_kg >= 0)
);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_status ON fleet_vehicles(status);

CREATE TABLE IF NOT EXISTS bulk_message_campaigns (
  id BIGSERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message VARCHAR(480) NOT NULL,
  audience_type VARCHAR(20) NOT NULL CHECK (audience_type IN ('all','branch','status')),
  branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  parcel_status VARCHAR(80),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'sending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS bulk_message_recipients (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES bulk_message_campaigns(id) ON DELETE CASCADE,
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  phone VARCHAR(40) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent','failed')),
  error_message VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bulk_message_campaigns_created ON bulk_message_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_message_recipients_campaign ON bulk_message_recipients(campaign_id);

CREATE TABLE IF NOT EXISTS financial_expenses (
  id BIGSERIAL PRIMARY KEY,
  description VARCHAR(240) NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Other',
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  expense_date DATE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_financial_expenses_date ON financial_expenses(expense_date DESC);
