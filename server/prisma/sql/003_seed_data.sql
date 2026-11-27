-- =============================================================================
-- Migration 003: Realistic Seed Data matching the Invoice Manager Mockups
-- Covers Clients, Suppliers, and all 6 Invoice Statuses
-- =============================================================================

INSERT INTO contacts (id, type, name, email, phone, nif, address, city, postal_code, is_archived)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'client',      'Boulangerie El Amel', 'client1@example.dz',        '0555 12 34 56', '001216098765432', '14 Rue Didouche Mourad',    'Alger', '16000', FALSE),
  ('11111111-1111-4111-8111-111111111102', 'client',      'SARL Tassili Pro',    'contact@tassili.example',   '0661 22 33 44', '001931045678912', 'Zone Industrielle Es-Senia','Oran',  '31000', FALSE),
  ('11111111-1111-4111-8111-111111111103', 'client',      'Ets Benali',          'benali@example.dz',         '0770 45 67 89', '',                'Boulevard Larbi Tebessi',   'Blida', '09000', FALSE),
  ('11111111-1111-4111-8111-111111111104', 'fournisseur', 'Papeterie Centrale',  'ventes@papeterie.example',  '023 45 67 89',  '',                'Rue Hassiba Ben Bouali',    'Alger', '16015', FALSE),
  ('11111111-1111-4111-8111-111111111105', 'client',      'Imprimerie Casbah',   'casbah@example.dz',         '0550 98 76 54', '',                '22 Rue Bab El Oued',        'Alger', '16008', FALSE),
  ('11111111-1111-4111-8111-111111111106', 'fournisseur', 'Grossiste Atlas',     'atlas@example.dz',          '0661 11 22 33', '',                'Cité El Hidhab',            'Sétif', '19000', FALSE),
  ('11111111-1111-4111-8111-111111111107', 'client',      'Café Djurdjura',      'djurdjura@example.dz',      '0551 77 88 99', '',                'Rue Abane Ramdane',         'Alger', '16002', FALSE),
  ('11111111-1111-4111-8111-111111111108', 'fournisseur', 'Pharmacie Rahmani',   'rahmani@example.dz',        '021 66 55 44',  '',                'Hydra Centre',              'Alger', '16035', FALSE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (id, number, contact_id, direction, issue_date, due_date, subtotal, tax_total, total, paid_amount, status, void_reason)
VALUES
  ('22222222-2222-4222-8222-222222222206', 'INV-2026-0006', '11111111-1111-4111-8111-111111111101', 'vente', '2026-11-24', '2026-12-24',  37815.13,  7184.87,  45000.00,     0.00, 'draft',          NULL),
  ('22222222-2222-4222-8222-222222222205', 'INV-2026-0005', '11111111-1111-4111-8111-111111111102', 'vente', '2026-11-20', '2026-12-20', 153361.34, 29138.66, 182500.00,     0.00, 'sent',           NULL),
  ('22222222-2222-4222-8222-222222222204', 'INV-2026-0004', '11111111-1111-4111-8111-111111111103', 'vente', '2026-11-12', '2026-12-12',  80672.27, 15327.73,  96000.00, 48000.00, 'partially_paid', NULL),
  ('22222222-2222-4222-8222-222222222203', 'INV-2026-0003', '11111111-1111-4111-8111-111111111107', 'vente', '2026-11-05', '2026-12-05',  32268.91,  6131.09,  38400.00, 38400.00, 'paid',           NULL),
  ('22222222-2222-4222-8222-222222222202', 'INV-2026-0002', '11111111-1111-4111-8111-111111111105', 'vente', '2026-10-18', '2026-11-18', 104831.93, 19918.07, 124750.00,     0.00, 'overdue',        NULL),
  ('22222222-2222-4222-8222-222222222201', 'INV-2026-0001', '11111111-1111-4111-8111-111111111108', 'achat', '2026-10-02', '2026-11-02',  22941.18,  4358.82,  27300.00,     0.00, 'void',           'Commande annulée par le fournisseur')
ON CONFLICT (number) DO NOTHING;
