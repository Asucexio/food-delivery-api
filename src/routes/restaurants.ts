import { Router } from 'express';
import supabaseClient from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { createRestaurantSchema,updateRestaurantSchema } from '../validators/restaurantValidators';

const router = Router();

// get all restaurants (no authentication required)
router.get('/', async (req, res) => {
  const { data, error } = await supabaseClient
    .from('restaurants')
    .select('*');

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// get the restaurant by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseClient
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(404).json({ error: error.message });
  }

  res.json(data);
});

// POST /restaurants/:id/menu-items
// restaurant_owner, must own THIS restaurant
router.post(
  '/:id/menu-items',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    // ownership check
    const { data: restaurant, error: restaurantError } = await supabaseClient
      .from('restaurants')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (restaurantError || !restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    if (restaurant.owner_id !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not own this restaurant',
      });
    }

    const { data, error } = await supabaseClient
      .from('menu_items')
      .insert({
        restaurant_id: id,
        name,
        description,
        price,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json(data);
  }
);

// get menu items for a specific restaurant
router.get('/:id/menu-items', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabaseClient
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// create restaurant
// only restaurant owners
router.post(
  '/',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    // Validate request body
    const result = createRestaurantSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }

    const { name, address, email, phone_number } = result.data;
    const owner_id = req.user?.id;

    const { data, error } = await supabaseClient
      .from('restaurants')
      .insert({
        name,
        address,
        email,
        phone_number,
        owner_id,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(201).json(data);
  }
);

// update restaurant
// only restaurant owners
router.patch(
  '/:id',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    const { id } = req.params;

    // Validate request body
    const result = updateRestaurantSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
    }

    const { data: existing, error: fetchError } = await supabaseClient
      .from('restaurants')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        error: 'Restaurant not found',
      });
    }

    if (existing.owner_id !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not own this restaurant',
      });
    }

    const { data, error } = await supabaseClient
      .from('restaurants')
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

// delete restaurant
// only restaurant owners
router.delete(
  '/:id',
  authenticate,
  authorize('restaurant_owner'),
  async (req, res) => {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabaseClient
      .from('restaurants')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({
        error: 'Restaurant not found',
      });
    }

    if (existing.owner_id !== req.user?.id) {
      return res.status(403).json({
        error: 'You do not own this restaurant',
      });
    }

    const { data, error } = await supabaseClient
      .from('restaurants')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        error: error.message,
      });
    }

    res.status(204).send();
  }
);

export default router;