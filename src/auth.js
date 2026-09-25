import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'segredo-de-teste';

export function signToken(usuario) {
  return jwt.sign({ id: usuario.id, papel: usuario.papel }, SECRET, { expiresIn: '8h' });
}

export function requireAuth(...papeis) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'token ausente' });
    try {
      const payload = jwt.verify(token, SECRET);
      if (papeis.length && !papeis.includes(payload.papel)) {
        return res.status(403).json({ erro: 'sem permissao' });
      }
      req.usuario = payload;
      next();
    } catch {
      res.status(401).json({ erro: 'token invalido' });
    }
  };
}
