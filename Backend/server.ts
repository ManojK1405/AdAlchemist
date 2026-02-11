import express , {Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express'
import clerkWebHooks from './controllers/clerk.js';

dotenv.config();

const app = express();

//Middleware
app.use(cors());

app.post('/api/clerk',express.raw({ type: 'application/json' }), clerkWebHooks)

app.use(express.json());
app.use(clerkMiddleware());


app.get('/', (req: Request, res: Response) => {
    res.send('Server is live');
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;