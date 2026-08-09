import { Router } from 'express';
import  supabaseClient  from '../config/supabase';

const router = Router();

 
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

  // Step 1: create the auth account
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? 'Registration failed' });
  }

  // Step 2: insert into our own `users` table, using the same id
  const { error: insertError } = await supabaseClient
    .from('users')
    .insert({
      id: data.user.id,
      email,
      name,
      role,
    });

  if (insertError) {
    return res.status(400).json({ error: insertError.message });
  }

  res.status(201).json({
    user: { id: data.user.id, email, name, role },
    session: data.session,
  });
});

/**
 * POST /auth/login
 * Body: { email, password }
 *
 * Verifies credentials with Supabase Auth and returns a session
 * (containing the access_token the client will send as "Authorization: Bearer <token>"
 * on every future request).
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  res.json({ session: data.session });
});

export default router;