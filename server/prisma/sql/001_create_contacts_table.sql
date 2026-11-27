-- =============================================================================
-- Migration 001: Contacts Table (FR-03: Create, edit & archive clients/suppliers)
-- Target: PostgreSQL 15+ (Supabase compatible)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger function to automatically maintain updated_at timestamps
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type         VARCHAR(20)  NOT NULL CHECK (type IN ('client', 'fournisseur')),
  name         VARCHAR(255) NOT NULL CHECK (char_length(trim(name)) > 0),
  email        VARCHAR(255) NOT NULL CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  phone        VARCHAR(50)  NOT NULL DEFAULT '',
  nif          VARCHAR(100) NOT NULL DEFAULT '',
  address      TEXT         NOT NULL DEFAULT '',
  city         VARCHAR(120) NOT NULL DEFAULT '',
  postal_code  VARCHAR(20)  NOT NULL DEFAULT '',
  is_archived  BOOLEAN      NOT NULL DEFAULT FALSE,
  archived_at  TIMESTAMPTZ  NULL,
  created_by   UUID         NULL,
  updated_by   UUID         NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Enforce unique email among active (non-archived) contacts (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_active_email
  ON contacts (LOWER(email))
  WHERE is_archived = FALSE;

-- Indexes for fast filtering & search on the Contacts list screen
CREATE INDEX IF NOT EXISTS idx_contacts_type        ON contacts (type);
CREATE INDEX IF NOT EXISTS idx_contacts_is_archived ON contacts (is_archived);
CREATE INDEX IF NOT EXISTS idx_contacts_city        ON contacts (city);
CREATE INDEX IF NOT EXISTS idx_contacts_name_lower  ON contacts (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_contacts_created_at  ON contacts (created_at DESC);

DROP TRIGGER IF EXISTS trg_contacts_updated_at ON contacts;
CREATE TRIGGER trg_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE contacts IS 'Customers (client) and suppliers (fournisseur) managed in Invoice Manager (FR-03).';
COMMENT ON COLUMN contacts.nif IS 'Numéro d''Identification Fiscale / Registre de commerce (optional).';
COMMENT ON COLUMN contacts.is_archived IS 'Soft-delete flag; archived contacts remain linked to historical invoices.';
