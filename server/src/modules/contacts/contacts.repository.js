import { query } from '../../config/pool.js';

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    email: row.email,
    phone: row.phone,
    nif: row.nif,
    address: row.address,
    city: row.city,
    postalCode: row.postal_code,
    invoiceCount: Number(row.invoice_count ?? 0),
    archived: row.is_archived,
    archivedAt: row.archived_at ? new Date(row.archived_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export const contactsRepository = {
  async list(filters) {
    const conditions = [];
    const params = [];

    if (filters.archived === 'false') {
      conditions.push('c.is_archived = FALSE');
    } else if (filters.archived === 'true') {
      conditions.push('c.is_archived = TRUE');
    }

    if (filters.type !== 'all') {
      params.push(filters.type);
      conditions.push(`c.type = $${params.length}`);
    }

    if (filters.city && filters.city.toLowerCase() !== 'all') {
      params.push(filters.city);
      conditions.push(`LOWER(c.city) = LOWER($${params.length})`);
    }

    if (filters.q) {
      params.push(`%${filters.q}%`);
      const p = `$${params.length}`;
      conditions.push(
        `(c.name ILIKE ${p} OR c.email ILIKE ${p} OR c.phone ILIKE ${p} OR c.city ILIKE ${p} OR c.nif ILIKE ${p})`
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*)::text AS total FROM contacts c ${whereClause}`,
      params
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    const offset = (filters.page - 1) * filters.limit;
    const listParams = [...params, filters.limit, offset];
    const limitParam = `$${params.length + 1}`;
    const offsetParam = `$${params.length + 2}`;

    const rowsResult = await query(
      `SELECT
         c.*,
         COUNT(i.id) FILTER (WHERE i.status <> 'void') AS invoice_count
       FROM contacts c
       LEFT JOIN invoices i ON i.contact_id = c.id
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      listParams
    );

    const tabCountsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE is_archived = FALSE)::text AS all_active,
         COUNT(*) FILTER (WHERE is_archived = FALSE AND type = 'client')::text AS clients,
         COUNT(*) FILTER (WHERE is_archived = FALSE AND type = 'fournisseur')::text AS fournisseurs,
         COUNT(*) FILTER (WHERE is_archived = TRUE)::text AS archived
       FROM contacts`
    );

    const citiesResult = await query(
      `SELECT DISTINCT city FROM contacts WHERE trim(city) <> '' ORDER BY city ASC`
    );

    const tc = tabCountsResult.rows[0];

    return {
      data: rowsResult.rows.map(mapRow),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
      counts: {
        all: Number(tc?.all_active ?? 0),
        client: Number(tc?.clients ?? 0),
        fournisseur: Number(tc?.fournisseurs ?? 0),
        archived: Number(tc?.archived ?? 0),
      },
      cities: citiesResult.rows.map((r) => r.city),
    };
  },

  async findById(id) {
    const result = await query(
      `SELECT
         c.*,
         COUNT(i.id) FILTER (WHERE i.status <> 'void') AS invoice_count
       FROM contacts c
       LEFT JOIN invoices i ON i.contact_id = c.id
       WHERE c.id = $1
       GROUP BY c.id`,
      [id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async findActiveByEmail(email, excludeId) {
    const params = [email.toLowerCase()];
    let sql = `SELECT id FROM contacts WHERE LOWER(email) = $1 AND is_archived = FALSE`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND id <> $2`;
    }
    const result = await query(sql, params);
    return result.rows[0] ?? null;
  },

  async create(input, actorId) {
    const result = await query(
      `INSERT INTO contacts (
         type, name, email, phone, nif, address, city, postal_code, created_by, updated_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
       RETURNING *, 0 AS invoice_count`,
      [
        input.type,
        input.name,
        input.email,
        input.phone,
        input.nif,
        input.address,
        input.city,
        input.postalCode,
        actorId ?? null,
      ]
    );
    return mapRow(result.rows[0]);
  },

  async update(id, input, actorId) {
    const columnMap = {
      type: 'type',
      name: 'name',
      email: 'email',
      phone: 'phone',
      nif: 'nif',
      address: 'address',
      city: 'city',
      postalCode: 'postal_code',
    };

    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(columnMap)) {
      const value = input[key];
      if (value !== undefined) {
        params.push(value);
        setClauses.push(`${column} = $${params.length}`);
      }
    }

    if (actorId) {
      params.push(actorId);
      setClauses.push(`updated_by = $${params.length}`);
    }

    if (setClauses.length === 0) {
      return this.findById(id);
    }

    params.push(id);
    const idParam = `$${params.length}`;

    const result = await query(
      `UPDATE contacts
       SET ${setClauses.join(', ')}
       WHERE id = ${idParam}
       RETURNING *,
         (SELECT COUNT(*) FROM invoices i WHERE i.contact_id = contacts.id AND i.status <> 'void') AS invoice_count`,
      params
    );

    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },

  async setArchived(id, archived, actorId) {
    const result = await query(
      `UPDATE contacts
       SET is_archived = $1,
           archived_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
           updated_by = COALESCE($2, updated_by)
       WHERE id = $3
       RETURNING *,
         (SELECT COUNT(*) FROM invoices i WHERE i.contact_id = contacts.id AND i.status <> 'void') AS invoice_count`,
      [archived, actorId ?? null, id]
    );
    return result.rows[0] ? mapRow(result.rows[0]) : null;
  },
};
