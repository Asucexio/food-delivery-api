import { Router } from 'express';
import supabaseClient from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { updateMenuItemSchema } from '../validators/menuItemValidators';

const router = Router();

// GET /menu-items/:id
// Get one menu item by its unique ID (public)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({
      error: 'Menu item not found',
    });
  }

  res.json(data);
});

// PATCH /menu-items/:id
// Update menu item
// Only the owner of the parent restaurant can do this
router.patch(
  '/:id',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    const { id } = req.params;

    // Validate request body
    const result = updateMenuItemSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }

    // Fetch the menu item to find out which restaurant it belongs to
    const { data: menuItem, error: menuItemError } =
      await supabaseClient
        .from('menu_items')
        .select('restaurant_id')
        .eq('id', id)
        .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        error: 'Menu item not found',
      });
    }

    // Fetch the restaurant to find out who owns it
    const { data: restaurant, error: restaurantError } =
      await supabaseClient
        .from('restaurants')
        .select('owner_id')
        .eq('id', menuItem.restaurant_id)
        .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        error: 'Parent restaurant not found',
      });
    }

    // Ownership check
    if (restaurant.owner_id !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not own this menu item',
      });
    }

    // Ownership confirmed - update the menu item
    const { data, error } = await supabaseClient
      .from('menu_items')
      .update(result.data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.json(data);
  }
);

// DELETE /menu-items/:id
// Restaurant owner, same indirect ownership check
router.delete(
  '/:id',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    const { id } = req.params;

    const { data: menuItem, error: menuItemError } =
      await supabaseClient
        .from('menu_items')
        .select('restaurant_id')
        .eq('id', id)
        .single();

    if (menuItemError || !menuItem) {
      return res.status(404).json({
        error: 'Menu item not found',
      });
    }

    const { data: restaurant, error: restaurantError } =
      await supabaseClient
        .from('restaurants')
        .select('owner_id')
        .eq('id', menuItem.restaurant_id)
        .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({
        error: 'Parent restaurant not found',
      });
    }

    if (restaurant.owner_id !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not own this menu item',
      });
    }

    const { error } = await supabaseClient
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(204).send();
  }
);

export default router;