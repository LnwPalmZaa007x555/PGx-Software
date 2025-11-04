import { Request, Response, NextFunction } from "express";

export function requireRole(roles: string | string[]) {
  const allow = Array.isArray(roles) ? roles : [roles];
  const allowLower = allow.map((r) => r.toLowerCase());
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role?.toLowerCase();
    if (!role) return res.status(401).json({ error: "Unauthenticated" });
    if (!allowLower.includes(role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
