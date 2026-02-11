import './configs/instument.mjs';
import express , {Request, Response} from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { clerkMiddleware } from '@clerk/express'
import clerkWebHooks from './controllers/clerk.js';
import * as Sentry from "@sentry/node";
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';


dotenv.config();

const app = express();

//Middleware
app.use(cors());

app.post('/api/clerk',express.raw({ type: 'application/json' }), clerkWebHooks)

app.use(express.json());
app.use(clerkMiddleware());

//Routes
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Server is live');
}); 

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;