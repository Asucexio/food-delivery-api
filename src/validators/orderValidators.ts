import { z } from 'zod';

// a single line item within an order (matches the `items` array shape
// we designed: [{ menuItemId, quantity }])
const orderItemSchema = z.object({
  menuItemId: z.string().uuid('menuItemId must be a valid id'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
});

// used for POST /orders
export const createOrderSchema = z.object({
  restaurantId: z.string().uuid('restaurantId must be a valid id'),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: z.string().min(1, 'Delivery address is required'),
});

// used for PATCH /orders/:id - only the status can be updated this way,
// and it must be one of the exact values allowed by our `order_status` enum
export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled']),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;