import { Router, Request, Response } from 'express';
import  supabaseClient from '../config/supabase';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    // pass extra user metadata in the second argument
    const { data, error } = await supabaseClient.auth.signUp(
      { email, password },
      { data: { name, role } }
    );

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
