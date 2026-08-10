import { z } from 'zod';

// used for POST /restaurants - name is the only required field,
// matching the `not null` columns in the database schema
export const createRestaurantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().optional(),
  phone_number: z
    .string()
    .regex(/^(09\d{8}|\+2519\d{8})$/, 'Enter a valid Ethiopian phone number')
    .optional(),
  email: z.string().email('Must be a valid email').optional(),
});

// used for PATCH /restaurants/:id - everything optional, since a client
// might only want to update ONE field (e.g. just the phone number)
export const updateRestaurantSchema = createRestaurantSchema.partial();

// TypeScript types generated directly from the schemas - no need to
// define these shapes a second time by hand
export type CreateRestaurantInput = z.infer<typeof createRestaurantSchema>;
export type UpdateRestaurantInput = z.infer<typeof updateRestaurantSchema>;