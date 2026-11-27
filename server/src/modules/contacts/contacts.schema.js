import { z } from 'zod';

export const uuidParamSchema = z.object({
  id: z.string().uuid('Identifiant de contact invalide.'),
});

export const createContactSchema = z.object({
  type: z
    .string()
    .refine((v) => v === 'client' || v === 'fournisseur', {
      message: 'Le type doit être "client" ou "fournisseur".',
    }),
  name: z
    .string()
    .trim()
    .min(1, 'Le nom est obligatoire.')
    .max(255, 'Le nom ne doit pas dépasser 255 caractères.'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "L'adresse e-mail est obligatoire.")
    .email("Le format de l'e-mail est invalide.")
    .max(255),
  phone: z.string().trim().max(50).optional().default(''),
  nif: z.string().trim().max(100).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
});

export const updateContactPutSchema = createContactSchema;

export const updateContactPatchSchema = createContactSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Au moins un champ doit être fourni pour la mise à jour.',
  });

export const listContactsQuerySchema = z.object({
  type: z.enum(['all', 'client', 'fournisseur']).optional().default('all'),
  archived: z.enum(['false', 'true', 'all']).optional().default('false'),
  city: z.string().trim().optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
