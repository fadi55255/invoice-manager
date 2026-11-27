import { logActivity } from '../activity-logs/activityLog.js';
import { AppError } from '../../shared/errors.js';
import { contactsRepository } from './contacts.repository.js';

export const contactsService = {
  async listContacts(filters) {
    return contactsRepository.list(filters);
  },

  async getContactById(id) {
    const contact = await contactsRepository.findById(id);
    if (!contact) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }
    return contact;
  },

  async createContact(input, actor) {
    const existing = await contactsRepository.findActiveByEmail(input.email);
    if (existing) {
      throw new AppError(
        409,
        'Un contact actif utilise déjà cette adresse e-mail.',
        'DUPLICATE_EMAIL'
      );
    }

    const created = await contactsRepository.create(input, actor?.id);

    await logActivity({
      entityType: 'contact',
      entityId: created.id,
      action: 'contact.created',
      actor,
      metadata: { name: created.name, type: created.type, email: created.email },
    });

    return created;
  },

  async updateContact(id, input, actor) {
    const current = await contactsRepository.findById(id);
    if (!current) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }

    if (input.email && input.email.toLowerCase() !== current.email.toLowerCase()) {
      const duplicate = await contactsRepository.findActiveByEmail(
        input.email,
        id
      );
      if (duplicate) {
        throw new AppError(
          409,
          'Un autre contact actif utilise déjà cette adresse e-mail.',
          'DUPLICATE_EMAIL'
        );
      }
    }

    const updated = await contactsRepository.update(id, input, actor?.id);
    if (!updated) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }

    await logActivity({
      entityType: 'contact',
      entityId: updated.id,
      action: 'contact.updated',
      actor,
      metadata: { changedFields: Object.keys(input) },
    });

    return updated;
  },

  async archiveContact(id, actor) {
    const updated = await contactsRepository.setArchived(id, true, actor?.id);
    if (!updated) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }

    await logActivity({
      entityType: 'contact',
      entityId: updated.id,
      action: 'contact.archived',
      actor,
    });

    return updated;
  },

  async restoreContact(id, actor) {
    const current = await contactsRepository.findById(id);
    if (!current) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }

    const duplicate = await contactsRepository.findActiveByEmail(
      current.email,
      id
    );
    if (duplicate) {
      throw new AppError(
        409,
        'Impossible de restaurer : un contact actif utilise déjà cet e-mail.',
        'DUPLICATE_EMAIL'
      );
    }

    const restored = await contactsRepository.setArchived(id, false, actor?.id);
    if (!restored) {
      throw new AppError(404, 'Contact introuvable.', 'CONTACT_NOT_FOUND');
    }

    await logActivity({
      entityType: 'contact',
      entityId: restored.id,
      action: 'contact.restored',
      actor,
    });

    return restored;
  },
};
