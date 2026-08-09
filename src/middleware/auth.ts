import { Request, Response, NextFunction } from 'express';

// augment Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
        role?: string;
      };
    }
  }
}
import  supabaseClient  from '../config/supabase';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  
  const authHeader = req.headers.authorization; 

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }
 
  const token = authHeader.split(' ')[1];

 
  const { data, error } = await supabaseClient.auth.getUser(token);

 
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

 
  const { data: profile, error: profileError } = await supabaseClient
    .from('users')
    .select('name, role')
    .eq('id', data.user.id)
    .single();

  if (profileError || !profile) {
    return res.status(401).json({ error: 'User profile not found' });
  }

  
  req.user = {
    id: data.user.id,
    email: data.user.email!,
    name: profile.name,
    role: profile.role,
  };

  
  next();
}