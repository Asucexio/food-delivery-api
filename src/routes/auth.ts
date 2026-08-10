import { Router } from 'express';
import  supabaseClient  from '../config/supabase';

const router = Router();

 
router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;

 
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? 'Registration failed' });
  }

  
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