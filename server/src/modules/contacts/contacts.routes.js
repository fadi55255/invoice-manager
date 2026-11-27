import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  createContactSchema,
  listContactsQuerySchema,
  updateContactPatchSchema,
  updateContactPutSchema,
  uuidParamSchema,
} from './contacts.schema.js';
import { contactsService } from './contacts.service.js';

export const contactsRouter = Router();

contactsRouter.use(authenticate);

contactsRouter.get(
  '/',
  requireRole('admin', 'accountant', 'viewer'),
  async (req, res, next) => {
    try {
      const filters = listContactsQuerySchema.parse(req.query);
      const result = await contactsService.listContacts(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.get(
  '/:id',
  requireRole('admin', 'accountant', 'viewer'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const contact = await contactsService.getContactById(id);
      res.json({ data: contact });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.post(
  '/',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const input = createContactSchema.parse(req.body);
      const created = await contactsService.createContact(input, req.user);
      res.status(201).json({ data: created });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.put(
  '/:id',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const input = updateContactPutSchema.parse(req.body);
      const updated = await contactsService.updateContact(id, input, req.user);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.patch(
  '/:id',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const input = updateContactPatchSchema.parse(req.body);
      const updated = await contactsService.updateContact(id, input, req.user);
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.patch(
  '/:id/archive',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const archived = await contactsService.archiveContact(id, req.user);
      res.json({ data: archived });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.patch(
  '/:id/restore',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const restored = await contactsService.restoreContact(id, req.user);
      res.json({ data: restored });
    } catch (err) {
      next(err);
    }
  }
);

contactsRouter.delete(
  '/:id',
  requireRole('admin', 'accountant'),
  async (req, res, next) => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const archived = await contactsService.archiveContact(id, req.user);
      res.json({ data: archived });
    } catch (err) {
      next(err);
    }
  }
);
