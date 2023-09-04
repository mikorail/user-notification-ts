import { PrismaClient,Prisma } from '@prisma/client';
import { UserModel } from '../model/UserModel';
import { formatText, formatDate } from '../utils/TextUtils';

const prisma = new PrismaClient();

export class UserService {
  static async getUsers(limit?: number): Promise<UserModel[]> {
    try {
      const users = await prisma.user.findMany({
        take: limit || undefined,
      });
      return users;
    } catch (error) {
      throw new Error('Error fetching users');
    }
  }

  static async createUser(userData: any) {
    const { first_name, last_name, email, city, continent, birthday } = userData;
  
    if (!first_name || !email || !city || !continent || !birthday) {
      throw new Error('Required fields are missing or empty');
    }
  
    const birthdayDate = formatDate(birthday);
  
    if (!birthdayDate) {
      throw new Error('Invalid birthday format');
    }
  
    const parsedBirthday = new Date(birthdayDate);
    const currentDate = new Date();
  
    if (parsedBirthday > currentDate) {
      throw new Error('Birthday date cannot be in the future');
    }
  
    const formattedCity = formatText(city || '');
    const formattedContinent = formatText(continent || '');
  
    const formattedLastName = last_name || ''; // Set last_name to an empty string if not provided
  
    try {
      const newUser = await prisma.user.create({
        data: {
          first_name,
          last_name: formattedLastName,
          email,
          city: formattedCity,
          continent: formattedContinent,
          birthday: new Date(parsedBirthday).toISOString(),
          gen_status: false,
        },
      });
  
      return newUser;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Duplicate record error
          throw new Error('Duplicate Record');
        } else {
          // Other database errors
          throw error;
        }
      } else {
        throw error;
      }
    }
  }
  

  static async getUserById(userId: number) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });
      return user;
    } catch (error) {
      throw error;
    }
  }

  static async deleteUserById(userId: number) {
    try {
      const deletedUser = await prisma.user.delete({
        where: { id: userId },
      });
      return deletedUser;
    } catch (error) {
      throw error;
    }
  }
  static async updateUser(id: number, userData: any) {
    try {
      const currentUser = await prisma.user.findUnique({
        where: { id },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      let { city, continent, birthday } = userData;

      if (city) {
        city = formatText(city);
      } else {
        city = currentUser.city;
      }

      if (continent) {
        continent = formatText(continent);
      } else {
        continent = currentUser.continent;
      }

      if (birthday) {
        const formattedBirthday = formatDate(birthday);

        if (!formattedBirthday) {
          throw new Error('Invalid birthday format');
        }

        const parsedBirthday = new Date(formattedBirthday);
        const currentDate = new Date();
  
        if (parsedBirthday > currentDate) {
          throw new Error('Birthday date cannot be in the future');
        }

        if (
          currentUser.birthday &&
          currentUser.birthday.toISOString() !== formattedBirthday
        ) {
          await prisma.message.deleteMany({
            where: { userid: id, birthday: currentUser.birthday },
          });
        }
      } else {
        birthday = currentUser.birthday?.toISOString() || null;
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...userData,
          birthday: birthday ? new Date(birthday).toISOString() : null,
          city: city,
          continent: continent,
          gen_status: false,
        },
      });

      return updatedUser;
   } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Duplicate email error
        throw new Error('Duplicate email');
      }
    }
      throw error;
    }
  }
  static async getUsersWithBirthdayToday(){
    try {
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentDay = today.getDate();
  
        const usersWithBirthdayToday : UserModel[] = await prisma.$queryRaw`
          SELECT *
          FROM "User"
          WHERE EXTRACT(MONTH FROM birthday) = ${currentMonth}
          AND EXTRACT(DAY FROM birthday) = ${currentDay}
          AND EXTRACT(YEAR FROM birthday) <= ${today.getFullYear()}
        `;
  
        if (!usersWithBirthdayToday || usersWithBirthdayToday.length === 0) {
          // Return an error message with a 404 status code when no users are found
          throw { statusCode: 404, message: 'No users found with birthdays today' };
        }
  
        return usersWithBirthdayToday;
      } catch (error) {
        throw new Error('Error fetching users with birthdays today');
      }
    }
      
}
