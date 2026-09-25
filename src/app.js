import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { router as authRouter } from './routes/auth.js';
import { router as usuariosRouter } from './routes/usuarios.js';
import { router as tecnicosRouter } from './routes/tecnicos.js';
import { router as planosRouter } from './routes/planos.js';
import { router as clientesRouter } from './routes/clientes.js';
import { router as ordensRouter } from './routes/ordens.js';
import { router as faturasRouter } from './routes/faturas.js';
import { router as inadimplenciaRouter } from './routes/inadimplencia.js';
import { router as redeRouter } from './routes/rede.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/tecnicos', tecnicosRouter);
app.use('/planos', planosRouter);
app.use('/clientes', clientesRouter);
app.use('/ordens-servico', ordensRouter);
app.use('/faturas', faturasRouter);
app.use('/inadimplencia', inadimplenciaRouter);
app.use('/rede', redeRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ erro: 'erro interno' });
});
