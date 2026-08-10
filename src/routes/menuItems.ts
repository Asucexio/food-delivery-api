import {Router} from 'express';
import supabaseClient from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../types';
const router = Router();

// get one menu item by its own unique id (public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabaseClient
        .from('menu_items')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json(data);
});

// update the menu item (only the owner of the PARENT restaurant can do this)
router.patch('/:id', authenticate, authorize('restaurant_owner'), async (req, res) => {
    const { id } = req.params;
    const { name, description, price } = req.body;

    //fetch the menu item to find out which restaurant it belongs to
    const { data: menuItem, error: menuItemError } = await supabaseClient
        .from('menu_items')
        .select('restaurant_id')
        .eq('id', id)
        .single();

    if (menuItemError || !menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
    }

    //fetch that restaurant to find out who actually owns it
    const { data: restaurant, error: restaurantError } = await supabaseClient
        .from('restaurants')
        .select('owner_id')
        .eq('id', menuItem.restaurant_id)
        .single();

    if (restaurantError || !restaurant) {
        return res.status(404).json({ error: 'Parent restaurant not found' });
    }

   //ownership check - does the logged-in user own THIS restaurant?
    if (restaurant.owner_id !== req.user?.id) {
        return res.status(403).json({ error: 'You do not own this menu item' });
    }

  //ownership confirmed - perform the actual update
    const { data, error } = await supabaseClient
        .from('menu_items')
        .update({ name, description, price })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        return res.status(400).json({ error: error.message });
    }

    res.json(data);
});


// DELETE /menu-items/:id - restaurant_owner, same indirect ownership check
router.delete('/:id', authenticate, authorize('restaurant_owner'), async (req, res) => {
    const { id } = req.params;
 
    const { data: menuItem, error: menuItemError } = await supabaseClient
        .from('menu_items')
        .select('restaurant_id')
        .eq('id', id)
        .single();
 
    if (menuItemError || !menuItem) {
        return res.status(404).json({ error: 'Menu item not found' });
    }
 
    const { data: restaurant, error: restaurantError } = await supabaseClient
        .from('restaurants')
        .select('owner_id')
        .eq('id', menuItem.restaurant_id)
        .single();
 
    if (restaurantError || !restaurant) {
        return res.status(404).json({ error: 'Parent restaurant not found' });
    }
 
    if (restaurant.owner_id !== req.user?.id) {
        return res.status(403).json({ error: 'You do not own this menu item' });
    }
 
    const { error } = await supabaseClient.from('menu_items').delete().eq('id', id);
    if (error) {
        return res.status(400).json({ error: error.message });
    }
 
    res.status(204).send();
});

export default router;
