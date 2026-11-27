-- =============================================================================
-- Migration 002: Invoices (6 statuses), Line Items, Payments & Activity Log
-- Supports FR-04, FR-08, FR-09, FR-11, FR-12, FR-14
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number        VARCHAR(40)    NOT NULL UNIQUE,
  contact_id    UUID           NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
  direction     VARCHAR(20)    NOT NULL CHECK (direction IN ('vente', 'achat')),
  issue_date    DATE           NOT NULL DEFAULT CURRENT_DATE,
  due_date      DATE           NOT NULL,
  subtotal      NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  tax_total     NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total         NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  paid_amount   NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0 AND paid_amount <= total),
  -- Always calculated, never typed in (Section 1.6 & 4.1)
  balance       NUMERIC(12, 2) GENERATED ALWAYS AS (total - paid_amount) STORED,
  -- The 6 canonical statuses (FR-09)
  status        VARCHAR(20)    NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'sent', 'partially_paid', 'paid', 'overdue', 'void')),
  void_reason   TEXT           NULL,
  notes         TEXT           NOT NULL DEFAULT '',
  attachment_url TEXT          NULL,
  created_by    UUID           NULL,
  updated_by    UUID           NULL,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_invoices_due_after_issue CHECK (due_date >= issue_date)
);

CREATE INDEX IF NOT EXISTS idx_invoices_contact_id ON invoices (contact_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status     ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_direction  ON invoices (direction);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices (issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date   ON invoices (due_date);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON invoices;
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- Line items (Section 4.1: exact 2-decimal math)
CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID           NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(500)   NOT NULL,
  quantity    NUMERIC(12, 2) NOT NULL CHECK (quantity > 0),
  unit_price  NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  tax_rate    NUMERIC(5, 2)  NOT NULL DEFAULT 19.00 CHECK (tax_rate >= 0 AND tax_rate <= 100),
  line_total  NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(quantity * unit_price, 2)) STORED,
  line_tax    NUMERIC(12, 2) GENERATED ALWAYS AS (ROUND(ROUND(quantity * unit_price, 2) * tax_rate / 100.0, 2)) STORED,
  sort_order  INT            NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- Payments table (FR-08)
CREATE TABLE IF NOT EXISTS payments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   UUID           NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  amount       NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE           NOT NULL DEFAULT CURRENT_DATE,
  method       VARCHAR(50)    NOT NULL DEFAULT 'virement',
  reference    VARCHAR(120)   NOT NULL DEFAULT '',
  notes        TEXT           NOT NULL DEFAULT '',
  recorded_by  UUID           NULL,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments (invoice_id);

-- Activity history log (FR-14: log who changed what and when)
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  actor_id    UUID         NULL,
  actor_email VARCHAR(255) NULL,
  actor_role  VARCHAR(30)  NULL,
  metadata    JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs (created_at DESC);
