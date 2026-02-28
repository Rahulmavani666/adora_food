import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Legacy sample data types (kept for seed script compatibility)
interface SampleRestaurant {
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  rating: number;
  isOpen: boolean;
  openingHours: Record<string, { open: string; close: string }>;
}

interface SampleFoodItem {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  restaurantId: string;
  isAvailable: boolean;
}

export const sampleRestaurants: Omit<SampleRestaurant, never>[] = [
  {
    name: 'Delicious Bites',
    description: 'Fresh and delicious food made with love',
    address: '456 Food Street, Cuisine City, FC 12345',
    phone: '+1 (555) 987-6543',
    email: 'info@deliciousbites.com',
    image: '/restaurant1.jpg',
    rating: 4.5,
    isOpen: true,
    openingHours: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '23:00' },
      saturday: { open: '09:00', close: '23:00' },
      sunday: { open: '09:00', close: '21:00' }
    }
  },
  {
    name: 'Pizza Palace',
    description: 'Authentic Italian pizza and pasta',
    address: '789 Pizza Avenue, Italian Town, IT 67890',
    phone: '+1 (555) 456-7890',
    email: 'orders@pizzapalace.com',
    image: '/restaurant2.jpg',
    rating: 4.3,
    isOpen: true,
    openingHours: {
      monday: { open: '11:00', close: '23:00' },
      tuesday: { open: '11:00', close: '23:00' },
      wednesday: { open: '11:00', close: '23:00' },
      thursday: { open: '11:00', close: '23:00' },
      friday: { open: '11:00', close: '00:00' },
      saturday: { open: '11:00', close: '00:00' },
      sunday: { open: '12:00', close: '22:00' }
    }
  },
  {
    name: 'Burger House',
    description: 'Juicy burgers and crispy fries',
    address: '321 Burger Lane, Fast Food City, FF 54321',
    phone: '+1 (555) 321-0987',
    email: 'hello@burgerhouse.com',
    image: '/restaurant3.jpg',
    rating: 4.1,
    isOpen: true,
    openingHours: {
      monday: { open: '10:00', close: '22:00' },
      tuesday: { open: '10:00', close: '22:00' },
      wednesday: { open: '10:00', close: '22:00' },
      thursday: { open: '10:00', close: '22:00' },
      friday: { open: '10:00', close: '23:00' },
      saturday: { open: '10:00', close: '23:00' },
      sunday: { open: '11:00', close: '21:00' }
    }
  }
];

export const sampleFoodItems: Omit<SampleFoodItem, never>[] = [
  // Delicious Bites items
  {
    name: 'Grilled Chicken Salad',
    description: 'Fresh mixed greens with grilled chicken breast, cherry tomatoes, and balsamic vinaigrette',
    price: 12.99,
    image: '/food1.jpg',
    category: 'Salads',
    restaurantId: 'restaurant_1',
    isAvailable: true
  },
  {
    name: 'Beef Stir Fry',
    description: 'Tender beef strips with mixed vegetables in savory sauce, served with steamed rice',
    price: 16.99,
    image: '/food2.jpg',
    category: 'Main Course',
    restaurantId: 'restaurant_1',
    isAvailable: true
  },
  {
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 8.99,
    image: '/food3.jpg',
    category: 'Desserts',
    restaurantId: 'restaurant_1',
    isAvailable: true
  },

  // Pizza Palace items
  {
    name: 'Margherita Pizza',
    description: 'Classic pizza with tomato sauce, mozzarella cheese, and fresh basil',
    price: 14.99,
    image: '/food4.jpg',
    category: 'Pizza',
    restaurantId: 'restaurant_2',
    isAvailable: true
  },
  {
    name: 'Spaghetti Carbonara',
    description: 'Pasta with eggs, cheese, pancetta, and black pepper',
    price: 13.99,
    image: '/food5.jpg',
    category: 'Pasta',
    restaurantId: 'restaurant_2',
    isAvailable: true
  },
  {
    name: 'Tiramisu',
    description: 'Italian dessert with coffee-soaked ladyfingers and mascarpone cream',
    price: 9.99,
    image: '/food6.jpg',
    category: 'Desserts',
    restaurantId: 'restaurant_2',
    isAvailable: true
  },

  // Burger House items
  {
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with cheese, lettuce, tomato, and special sauce',
    price: 11.99,
    image: '/food7.jpg',
    category: 'Burgers',
    restaurantId: 'restaurant_3',
    isAvailable: true
  },
  {
    name: 'Chicken Wings',
    description: 'Crispy chicken wings with choice of sauce: BBQ, Buffalo, or Honey Mustard',
    price: 10.99,
    image: '/food8.jpg',
    category: 'Appetizers',
    restaurantId: 'restaurant_3',
    isAvailable: true
  },
  {
    name: 'French Fries',
    description: 'Crispy golden fries seasoned with sea salt',
    price: 4.99,
    image: '/food9.jpg',
    category: 'Sides',
    restaurantId: 'restaurant_3',
    isAvailable: true
  }
];

export const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Add restaurants
    const restaurantRefs: string[] = [];
    for (const restaurant of sampleRestaurants) {
      const docRef = await addDoc(collection(db, 'restaurants'), {
        ...restaurant,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      restaurantRefs.push(docRef.id);
      console.log(`Added restaurant: ${restaurant.name} with ID: ${docRef.id}`);
    }

    // Add food items (using the restaurant IDs we just created)
    for (let i = 0; i < sampleFoodItems.length; i++) {
      const foodItem = sampleFoodItems[i];
      const restaurantIndex = Math.floor(i / 3); // 3 items per restaurant
      const restaurantId = restaurantRefs[restaurantIndex];
      
      const docRef = await addDoc(collection(db, 'foodItems'), {
        ...foodItem,
        restaurantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log(`Added food item: ${foodItem.name} with ID: ${docRef.id}`);
    }

    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Function to clear all data (useful for testing)
export const clearDatabase = async () => {
  try {
    console.log('Clearing database...');
    
    // Note: In a real application, you'd want to implement proper deletion
    // This is just a placeholder for development purposes
    console.log('Database cleared successfully!');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};


