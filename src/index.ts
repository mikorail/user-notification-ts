import { PrismaClient,Prisma } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"
import { parse, format } from 'date-fns';
import { DateTime, Settings,IANAZone } from 'luxon';


interface User {
  id: number;
  first_name: string;
  last_name?: string | null;
  email?: string;
  continent: string;
  city: string;
  birthday?: Date;
}

const prisma = new PrismaClient({
  // log: ['query'], // Enable query logging
});
const app = express()

app.use(express.json())


app.get('/users', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    let parsedLimit: number | undefined;

    // Parse the limit if it's provided
    if (limit) {
      parsedLimit = parseInt(limit as string, 10);

      // Ensure the parsed limit is within the range of 5 to 500
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return res.status(400).json({ error: 'Invalid limit value. Limit must be between 5 and 500.' });
      }
    }

    // Determine whether to fetch all users or apply the specified limit
    const fetchAll = !limit || !parsedLimit;

    const users = await prisma.user.findMany({
      take: fetchAll ? undefined : parsedLimit,
    });

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/users/birthday-today', async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Get the current month (adding 1 because months are 0-indexed)
    const currentDay = today.getDate(); // Get the current day of the month

    // Use a raw SQL query to find users with matching birthdays
    const usersWithBirthdayToday = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE EXTRACT(MONTH FROM birthday) = ${currentMonth}
      AND EXTRACT(DAY FROM birthday) = ${currentDay}
      AND EXTRACT(YEAR FROM birthday) <= ${today.getFullYear()}
    `;


    res.json(usersWithBirthdayToday);
  } catch (error) {
    console.error('Error fetching users with birthdays today:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/user', async (req, res) => {
  try {
    const { first_name, last_name, email, city, continent, birthday } = req.body;

    // Check if required fields are missing or empty
    if (!first_name || !email || !city || !continent || !birthday) {
      return res.status(400).json({ error: 'Required fields are missing or empty' });
    }

    // Parse and format the birthday field to "YYYY-MM-DD" format
    const birthdayDate = formatDate(birthday);

    if (!birthdayDate) {
      return res.status(400).json({ error: 'Invalid birthday format' });
    }

    const parsedBirthday = new Date(birthdayDate);
    const currentDate = new Date();

    if (parsedBirthday > currentDate) {
      return res.status(400).json({ error: 'Birthday date cannot be in the future' });
    }

    // Transform city and continent fields
    const formattedCity = formatText(city || '');
    const formattedcontinent = formatText(continent || '');

    // Insert data into the database using Prisma
    const newUser = await prisma.user.create({
      data: {
        first_name,
        last_name,
        email,
        city: formattedCity,
        continent: formattedcontinent,
        birthday: new Date(parsedBirthday).toISOString(),
        gen_status: false,
      },
    });

    res.status(201).json({ message: 'Data inserted successfully', newUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2022: Unique constraint failed
      // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
      if (error.code === 'P2002') {
        res.status(500).json({ error: 'Duplicate Record' });
      } else {
        // Handle other Prisma errors if needed
        res.status(500).json({ error: 'Prisma Error' });
      }
    } else {
      // Handle other unknown errors
      console.error('Unknown error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

app.get('/user/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });      

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/user/:id', validateBirthday, async (req: Request, res: Response) => {
  const { id } = req.params;
  let { city, continent, birthday } = req.body; // Assuming city, continent, and birthday are in the request body

  // Format city, continent, and birthday
  city = formatText(city);
  continent = formatText(continent);

  try {
    // Ensure that birthday is in ISO-8601 DateTime format
    const formattedBirthday = formatDate(birthday);

    if (!formattedBirthday) {
      return res.status(400).json({ error: 'Invalid birthday format' });
    }

    // Retrieve the current user's birthday
    const currentUser = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the birthday is changing
    if (currentUser.birthday?.toISOString() !== formattedBirthday) {
      // Delete messages associated with the old birthday
      await prisma.message.deleteMany({
        where: { userid: Number(id), birthday: currentUser.birthday },
      });
    }

    // Update the user's information
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        birthday: new Date(formattedBirthday).toISOString(),
        city: city, // Update the city with the formatted value
        continent: continent, // Update the continent with the formatted value
        gen_status: false,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2022') {
        res.status(409).json({ error: 'Email already exists' });
      } else if (error.code === 'P2025') {
        res.status(404).json({ error: 'User not found' });
      } else {
        res.status(500).json({ error: 'Prisma Error' });
      }
    } else {
      console.error('Unknown error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});


app.delete(`/user/:id`, async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deletedUser = await prisma.user.delete({
      where: { id: Number(id) },
    });

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(deletedUser);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

function validateBirthday(req: Request, res: Response, next: Function) {
  const { birthday } = req.body;

  if (birthday) {
    const formattedBirthday = formatDate(birthday);
    if (!formattedBirthday) {
      return res.status(400).json({ error: 'Invalid birthday format' });
    }
    req.body.birthday = formattedBirthday;
  }

  next();
}

// Function to parse and format the birthday field
function formatDate(birthday: string): string | null {
  try {
    // Define an array of possible date formats
    const dateFormats = ['MMMM dd yyyy', 'dd MMMM yyyy', 'yyyy-MM-dd'];
    
    // Iterate through the formats and try parsing the date
    for (const formatString of dateFormats) {
      const parsedDate = parse(birthday, formatString, new Date());
      if (!isNaN(parsedDate.getTime())) {
        return format(parsedDate, 'yyyy-MM-dd');
      }
    }
    
    return null; // Return null if no valid format is found
  } catch (error) {
    return null;
  }
}

function formatText(text: string): string {
  return text
    .split(' ')
    .map((word) => {
      const firstChar = word.charAt(0).toUpperCase();
      const restOfWord = word.slice(1).toLowerCase();
      return firstChar + restOfWord;
    })
    .join('_');
}

app.post('/send-birthday-messages', async (req, res) => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Get the current month (adding 1 because months are 0-indexed)
    const currentDay = today.getDate(); // Get the current day of the month
    
    const usersWithSameBirthday : User[] = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE EXTRACT(MONTH FROM birthday) = ${currentMonth}
      AND EXTRACT(DAY FROM birthday) = ${currentDay}
      AND EXTRACT(YEAR FROM birthday) <= ${today.getFullYear()}
      and gen_status is false
    `;
    
    

      for (const user of usersWithSameBirthday) {
        const fullName = `${user.first_name} ${user.last_name}`;

        const baseBDay = user?.birthday;

        const currentTimestamp = new Date().toISOString();
        const dateTimestamp = new Date(currentTimestamp);

        // Check if baseBDay is defined before using it
        if (baseBDay) {
        
          // Convert baseBDay to an ISO string
          const isoDateString = new Date(baseBDay).toISOString();
        
          // Get the current year
          const currentYear = new Date().getFullYear();
          const timeZone = `${user.continent}/${user.city}`
          // Get the date part
          const monthAndDay = isoDateString.slice(5, 10);

          const combinedDateTime = `${currentYear}-${monthAndDay}T09:00:00`;
          const localDateTime = DateTime.fromISO(combinedDateTime, { zone: timeZone  });

          // Calculate the time until the scheduled email (in milliseconds)
          const timeUntilEmail = localDateTime.toMillis() - DateTime.now().toMillis();
          const timeLeft = formatTimeDifference(timeUntilEmail);
          console.log("Time Left:", timeLeft);

        } else {
          console.error("User birthday is not defined.");
        }
    
        try {
          await prisma.$queryRaw`
            INSERT INTO "Message" ("userid", "message", "status", "city", "continent", "birthday", "email","sent_at")
            VALUES (${user.id}, ${`Happy Birthday to ${fullName}`}, true, ${user.city}, ${user.continent}, ${user.birthday}, ${user.email}, ${dateTimestamp})
          `;
    
          await prisma.$queryRaw`
            UPDATE "User"
            SET "gen_status" = true
            WHERE "id" = ${user.id} AND "email" = ${user.email}
          `;
        } catch (error) {
          console.error(error)
          console.error(`Error processing user ${user.id}`);
        }
      }
    

    console.log(`Birthday messages sent to ${usersWithSameBirthday.length} users.`);
    res.json({ message: `Birthday messages sent to ${usersWithSameBirthday.length} users.` });
  } catch (error) {
    console.error('Error sending birthday messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function formatTimeDifference(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const formattedTime = [];

  if (days > 0) {
    formattedTime.push(`${days} day${days > 1 ? 's' : ''}`);
  }
  if (hours % 24 > 0) {
    formattedTime.push(`${hours % 24} hour${hours % 24 > 1 ? 's' : ''}`);
  }
  if (minutes % 60 > 0) {
    formattedTime.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
  }
  if (seconds % 60 > 0) {
    formattedTime.push(`${seconds % 60} second${seconds % 60 > 1 ? 's' : ''}`);
  }

  if (formattedTime.length === 0) {
    return "less than a second";
  }

  return formattedTime.join(', ');
}

// handle 404 error
app.use((req: Request, res: Response, next: Function) => {
  next(createError(404))
})

app.listen(3000, () =>
  console.log(`⚡️[server]: Server is running at https://localhost:3000`)
)