import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import menuItemRoutes from './routes/menuItems';
import orderRoutes from './routes/orders';
 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, Asmamew!');
});

app.use('/auth', authRoutes);
app.use('/restaurants', restaurantRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/orders', orderRoutes);






const PORT = process.env.PORT || 6000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});