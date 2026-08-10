import { Router } from 'express';
import supabaseClient from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// every /orders route requires login
router.use(authenticate);

// POST /orders - customer only
router.post('/', authorize('customer'), async (req, res) => {
    const { restaurantId, items, deliveryAddress } = req.body;
    // items: [{ menuItemId, quantity }]

    const { data: order, error: orderError } = await supabaseClient
        .from('orders')
        .insert({
            customer_id: req.user?.id,
            restaurant_id: restaurantId,
            delivery_address: deliveryAddress,
            status: 'pending',
        })
        .select()
        .single();

    if (orderError || !order) {
        return res.status(400).json({ error: orderError?.message ?? 'Could not create order' });
    }

    // insert one row per item into order_items, using a price snapshot (as we discussed)
    const orderItemsToInsert = [];
    for (const item of items) {
        const { data: menuItem, error: menuItemError } = await supabaseClient
            .from('menu_items')
            .select('price')
            .eq('id', item.menuItemId)
            .single();

        if (menuItemError || !menuItem) {
            return res.status(400).json({ error: `Menu item ${item.menuItemId} not found` });
        }

        orderItemsToInsert.push({
            order_id: order.id,
            menu_item_id: item.menuItemId,
            quantity: item.quantity,
            price_at_order_time: menuItem.price,
        });
    }

    const { error: itemsError } = await supabaseClient.from('order_items').insert(orderItemsToInsert);

    if (itemsError) {
        return res.status(400).json({ error: itemsError.message });
    }

    res.status(201).json(order);
});

// GET /orders - any logged-in user, filtered to their own relevant orders
router.get('/', async (req, res) => {
    const user = req.user!;
    let query = supabaseClient.from('orders').select('*');

    if (user.role === 'customer') {
        query = query.eq('customer_id', user.id);
    } else if (user.role === 'driver') {
        query = query.eq('driver_id', user.id);
    } else if (user.role === 'restaurant_owner') {
        // indirect filter: find restaurants owned by this user first
        const { data: ownedRestaurants } = await supabaseClient
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id);

        const restaurantIds = (ownedRestaurants ?? []).map((r) => r.id);
        query = query.in('restaurant_id', restaurantIds);
    }

    const { data, error } = await query;
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

// GET /orders/:id - customer (own), restaurant_owner (their restaurant), driver (assigned)
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    const user = req.user!;

    const { data: order, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const isCustomerOwner = user.role === 'customer' && order.customer_id === user.id;
    const isAssignedDriver = user.role === 'driver' && order.driver_id === user.id;
    let isRestaurantOwner = false;

    if (user.role === 'restaurant_owner') {
        const { data: restaurant } = await supabaseClient
            .from('restaurants')
            .select('owner_id')
            .eq('id', order.restaurant_id)
            .single();
        isRestaurantOwner = restaurant?.owner_id === user.id;
    }

    if (!isCustomerOwner && !isAssignedDriver && !isRestaurantOwner) {
        return res.status(403).json({ error: 'You do not have access to this order' });
    }

    res.json(order);
});

// PATCH /orders/:id - restaurant_owner (pending->preparing->ready) or driver (ready->picked_up->delivered)
router.patch('/:id', authorize('restaurant_owner', 'driver'), async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user!;

    const { data: order, error } = await supabaseClient
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    const isAssignedDriver = user.role === 'driver' && order.driver_id === user.id;
    let isRestaurantOwner = false;

    if (user.role === 'restaurant_owner') {
        const { data: restaurant } = await supabaseClient
            .from('restaurants')
            .select('owner_id')
            .eq('id', order.restaurant_id)
            .single();
        isRestaurantOwner = restaurant?.owner_id === user.id;
    }

    if (!isAssignedDriver && !isRestaurantOwner) {
        return res.status(403).json({ error: 'You do not have access to update this order' });
    }

    const { data, error: updateError } = await supabaseClient
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        return res.status(400).json({ error: updateError.message });
    }

    res.json(data);
});

export default router;