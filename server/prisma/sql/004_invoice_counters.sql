BEGIN;

-- Last number issued per prefix and year. It only goes up.
CREATE TABLE IF NOT EXISTS public.invoice_counters (
  prefix       varchar(3) NOT NULL,
  year         integer    NOT NULL,
  last_number  integer    NOT NULL,
  PRIMARY KEY (prefix, year)
);

-- Blocks access through Supabase's public API; the table owner is not affected.
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;

-- Start after the invoices that already exist.
INSERT INTO public.invoice_counters (prefix, year, last_number)
SELECT split_part(number, '-', 1), split_part(number, '-', 2)::int,
       max(split_part(number, '-', 3)::int)
FROM public.invoices
WHERE number ~ '^(INV|PUR)-[0-9]{4}-[0-9]+$'
GROUP BY 1, 2
ON CONFLICT (prefix, year) DO NOTHING;

COMMIT;