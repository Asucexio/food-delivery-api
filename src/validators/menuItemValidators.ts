import { z } from 'zod';

// used for POST /restaurants/:id/menu-items - name and price required,
// matching the `not null` columns on menu_items
export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be greater than 0'),
});

// used for PATCH /menu-items/:id - everything optional
export const updateMenuItemSchema = createMenuItemSchema.partial();

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;