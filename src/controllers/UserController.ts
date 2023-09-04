import { Request, Response } from 'express';
import { UserService } from '../service/UserService';
import { ErrorUtils } from '../utils/ErrorUtils';


export const getUsers = async (req: Request, res: Response) => {
    try {
      const { limit } = req.query;
      const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;
  
      const users = await UserService.getUsers(parsedLimit);
  
      res.json(users);
    } catch (error) {
      ErrorUtils.sendError(res, 500, 'Internal server error');
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      console.log("userData", userData);
      if (!userData || !userData.first_name || !userData.email || !userData.city || !userData.continent || !userData.birthday) {
        return res.status(400).json({ error: 'Required fields are missing or empty' });
      }
      const newUser = await UserService.createUser(userData);
  
      res.status(201).json({ message: 'Data inserted successfully', newUser });
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'Duplicate Record':
            res.status(500).json({ error: 'Duplicate Record' });
            break;
          case 'Invalid birthday format':
            res.status(400).json({ error: 'Invalid birthday format' });
            break;
          case 'Birthday date cannot be in the future':
            res.status(400).json({ error: 'Birthday date cannot be in the future' });
            break;
          default:
            console.error('Error creating user:', error);
            res.status(500).json({ error: 'Internal server error' });
            break;
        }
      }
    }
  };  

export const getUserById = async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log("id",id)
  
    try {
      const user = await UserService.getUserById(Number(id));
  
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(user);
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

export const deleteUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  
    try {
          // Check if the user exists
        const userExists = await UserService.getUserById(Number(id));

        if (!userExists) {
        return res.status(404).json({ error: 'User not found' });
        }

      const deletedUser = await UserService.deleteUserById(Number(id));
  
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json(deletedUser);
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    const { id } = req.params;
    const userData = req.body;
  
    try {
      const updatedUser = await UserService.updateUser(Number(id), userData);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof Error) {
        switch (error.message) {
          case 'User not found':
            res.status(404).json({ error: 'User not found' });
            break;
          case 'Invalid birthday format':
            res.status(400).json({ error: 'Invalid birthday format' });
            break;
          case 'Duplicate email':
            res.status(409).json({ error: 'Duplicate email' });
            break;
          default:
            console.error('Unknown error:', error);
            res.status(500).json({ error: 'Internal server error' });
            break;
        }
      }
    }
  }  

export const getUsersWithBirthdayToday = async (req: Request, res: Response) => {
    try {
      const usersWithBirthdayToday = await UserService.getUsersWithBirthdayToday();
      res.json(usersWithBirthdayToday);
    } catch (error) {
      console.error('Error fetching users with birthdays today:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }