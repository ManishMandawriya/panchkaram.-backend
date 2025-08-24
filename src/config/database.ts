import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/User';
import { VerificationCode } from '../models/VerificationCode';
import { Category } from '../models/Category';
import { Review } from '../models/Review';
import { Appointment } from '../models/Appointment';
import { Service } from '../models/Service';
import { DoctorService } from '../models/DoctorService';
import { DoctorAvailability } from '../models/DoctorAvailability';
import { DoctorTimeSlot } from '../models/DoctorTimeSlot';
import { Banner } from '../models/Banner';
import { Chat } from '../models/Chat';
import { ChatSession } from '../models/ChatSession';
import { ChatMessage } from '../models/ChatMessage';
import { logger } from '../utils/logger';
import { 
  DB_HOST, 
  DB_PORT, 
  DB_NAME, 
  DB_USER, 
  DB_PASSWORD, 
  NODE_ENV 
} from './env';

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
      models: [User, VerificationCode, Category, Review, Appointment, Service, DoctorService, DoctorAvailability, DoctorTimeSlot, Banner, Chat, ChatSession, ChatMessage],
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Models are already initialized in the Sequelize constructor
    
    // Database sync completely disabled to fix startup issues
    // if (NODE_ENV === 'development') {
    //   await sequelize.sync({ force: false, alter: true });
    //   logger.info('Database synchronized successfully.');
    // }
    logger.info('Database sync disabled to fix startup issues.');
  } catch (error) {
    logger.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize; 