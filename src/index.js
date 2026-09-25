import 'dotenv/config';
import { app } from './app.js';
import { seed } from './seed.js';

seed();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`net-crm rodando em http://localhost:${port}`));
