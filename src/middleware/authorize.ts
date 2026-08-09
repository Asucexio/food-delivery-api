import { Request, Response, NextFunction } from 'express';
 
import { UserRole } from '../types';

 
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      // Safety net — should never happen if authenticate ran first
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const role = req.user.role;
    if (!role || !allowedRoles.includes(role as UserRole)) {
      return res.status(403).json({
        error: `Access denied. Required role(s): ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}