import { PrismaClient,Prisma } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"
import { parse, format } from 'date-fns';
import { DateTime } from 'luxon';


var cityTimezones = require('city-timezones');
interface User {
  id: number;
  first_name: string;
  last_name?: string | null;
  email?: string;
  continent: string;
  city: string;
  birthday?: Date;
  gen_status:boolean,
}

interface Message {
  id: number;
  userid: number;
  email?: string;
  message?: string;
  status:boolean,
  sent_at?: Date;
  created_at?: Date;
  continent: string;
  city: string;
  birthday?: Date;
}


const prisma = new PrismaClient({
  // log: ['query'], // Enable query logging
});
const app = express()

const axios = require('axios'); // Import the Axios library

const cron = require('node-cron');


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

  // Retrieve the current user's data
  const currentUser = await prisma.user.findUnique({
    where: { id: Number(id) },
  });

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Format city, continent, and birthday if they are provided
  if (city) {
    city = formatText(city);
  } else {
    city = currentUser.city; // Use the current value if not provided
  }

  if (continent) {
    continent = formatText(continent);
  } else {
    continent = currentUser.continent; // Use the current value if not provided
  }

  try {
    // Ensure that birthday is in ISO-8601 DateTime format if provided
    if (birthday) {
      const formattedBirthday = formatDate(birthday);

      if (!formattedBirthday) {
        return res.status(400).json({ error: 'Invalid birthday format' });
      }

      // Check if the birthday is changing
      if (currentUser.birthday && currentUser.birthday.toISOString() !== formattedBirthday) {
        // Delete messages associated with the old birthday
        await prisma.message.deleteMany({
          where: { userid: Number(id), birthday: currentUser.birthday },
        });
      }
    } else {
      birthday = currentUser.birthday?.toISOString() || null; // Use the current value if not provided
    }

    // Update the user's information
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        birthday: birthday ? new Date(birthday).toISOString() : null,
        city: city,
        continent: continent,
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
    .join(' ');
}

app.post('/send-birthday-messages', async (req, res) => {
  try {
    let updateCount = 0; // Initialize the count for update operations

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

      let timezone = '';

      const cityLookup = cityTimezones.lookupViaCity(`${user.city}`);
      // timezone = cityLookup[0].timezone;
      for (const entry of cityLookup) {
        if (entry.city === user.city && entry.timezone.includes(user.continent)) {
          timezone = entry.timezone;
          break;
        }
      }

      console.log(`The timezone for ${user.city} is ${timezone}`);

      const currentTimestamp = new Date().toISOString();
      const dateTimestamp = new Date(currentTimestamp);

      if (baseBDay) {
        const isoDateString = new Date(baseBDay).toISOString();
        const currentYear = new Date().getFullYear();
        const timeZone = `${user.continent}/${user.city}`
        const monthAndDay = isoDateString.slice(5, 10);

        const combinedDateTime = `${currentYear}-${monthAndDay}T09:00:00`;
        const localDateTime = new Date(combinedDateTime); // Convert to JavaScript Date

        // Calculate the time until the scheduled email (in milliseconds)
        const timeUntilEmail = localDateTime.getTime() - new Date().getTime();
        const timeLeft = formatTimeDifference(timeUntilEmail);
        console.log("User : ", user.email, " has this Time Left:", timeLeft);

        if (timeUntilEmail <= 0 || timeUntilEmail < 60000 || Number.isNaN(timeUntilEmail)) {
          try {
            await prisma.$queryRaw`
              INSERT INTO "Message" ("userid", "message", "status", "city", "continent", "birthday", "email")
              VALUES (${user.id}, ${`Happy Birthday to ${fullName}`}, false, ${user.city}, ${user.continent}, ${user.birthday}, ${user.email})
            `;

            await prisma.$queryRaw`
              UPDATE "User"
              SET "gen_status" = true
              WHERE "id" = ${user.id} AND "email" = ${user.email}
            `;
            
            // Send a request to 'https://email-service.digitalenvision.com.au/send-email'
            const emailServiceResponse = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
              to: user.email,
              subject: 'Happy Birthday!',
              message: `Happy Birthday to ${fullName}`,
            });

            console.log('Email service response:', emailServiceResponse.data);

            if (emailServiceResponse.status === 200) {
              // Update the message status and sent_at using the user's email
              await prisma.$queryRaw`
                UPDATE "Message"
                SET "status" = true, "sent_at" = ${dateTimestamp}
                WHERE "email" = ${user.email}
              `;
              
              updateCount++; // Increment the update count if an update was made
            }
          } catch (error) {
            console.error(error);
            console.error(`Error processing user ${user.id}`);
          }
        } else {
          console.error("User birthday is not defined.");
        }
      } else {
        console.error("User birthday is not defined.");
      }
    }

    console.log(`Birthday messages sent to ${updateCount} users.`);
    res.json({ message: `Birthday messages sent to ${updateCount} users.` });
  } catch (error) {
    console.error('Error sending birthday messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


const sendBirthdayMessages = async () => {
  console.log("hit")
  try {
    let updateCount = 0; // Initialize the count for update operations

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
        let timezone = '';

        const cityLookup = cityTimezones.lookupViaCity(`${user.city}`);
        // timezone = cityLookup[0].timezone;
        for (const entry of cityLookup) {
          if (entry.timezone.includes(user.continent)) {
            timezone = entry.timezone;
            break;
          }
        }

        console.log(`The timezone for ${user.city} is ${timezone}`);

        const currentTimestamp = new Date().toISOString();
        const dateTimestamp = new Date(currentTimestamp);

        if (baseBDay) {
        
          const isoDateString = new Date(baseBDay).toISOString();
        
          const currentYear = new Date().getFullYear();
          const timeZone = `${user.continent}/${user.city}`
          const monthAndDay = isoDateString.slice(5, 10);

          const combinedDateTime = `${currentYear}-${monthAndDay}T09:00:00`;
          const newBday = new Date(combinedDateTime)
          const localDateTime = DateTime.fromISO(combinedDateTime, { zone: timezone  });

          // Calculate the time until the scheduled email (in milliseconds)
          const timeUntilEmail = localDateTime.toMillis() - DateTime.now().toMillis();
          const timeLeft = formatTimeDifference(timeUntilEmail);
          console.log("User : ",user.email," have this Time Left:", timeLeft);
          if (timeUntilEmail <= 0 || timeUntilEmail < 60000 || timeUntilEmail < 0 || Number.isNaN(timeUntilEmail)) {

            try {
              await prisma.$queryRaw`
                INSERT INTO "Message" ("userid", "message", "status", "city", "continent", "birthday", "email")
                VALUES (${user.id}, ${`Happy Birthday to ${fullName}`}, false, ${user.city}, ${user.continent}, ${newBday}, ${user.email})
              `;
        
              await prisma.$queryRaw`
                UPDATE "User"
                SET "gen_status" = true
                WHERE "id" = ${user.id} AND "email" = ${user.email}
              `;
                          
            // Send a request to 'https://email-service.digitalenvision.com.au/send-email'
            const emailServiceResponse = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
              email: user.email,
              message: `Happy Birthday to ${fullName}`,
            });

            console.log('Email service response:', emailServiceResponse.data);

            if (emailServiceResponse.status === 200) {
              // Update the message status and sent_at using the user's email
              await prisma.$queryRaw`
                UPDATE "Message"
                SET "status" = true, "sent_at" = ${dateTimestamp}
                WHERE "email" = ${user.email}
              `;
              
              updateCount++; // Increment the update count if an update was made
            }
            } catch (error) {
              console.error(error)
              console.error(`Error processing user ${user.id}`);
            }

          } else {
            // console.error("User : ",user?.email ,"birthday ",user.birthday,"is not defined.");
          }
        }else{

        }
      }
    console.log(`Birthday messages sent to ${updateCount} users.`);
  } catch (error) {
    console.error('Error sending birthday messages:', error);
  }
}

const sweepUnsentMessage = async () => {
  try {
    let updateCount = 0; // Initialize the count for update operations

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Get the current month (adding 1 because months are 0-indexed)
    const currentDay = today.getDate(); // Get the current day of the month
    
    const messageWithSameBirthday : Message[] = await prisma.$queryRaw`
      SELECT *
      FROM "Message"
      WHERE EXTRACT(MONTH FROM birthday) = ${currentMonth}
      AND EXTRACT(DAY FROM birthday) = ${currentDay}
      AND EXTRACT(YEAR FROM birthday) <= ${today.getFullYear()}
      and status is false
    `;
    
      for (const message of messageWithSameBirthday) {
        // const fullName = `${user.first_name} ${user.last_name}`;

        const baseBDay = message?.birthday;
        let timezone = '';

        const cityLookup = cityTimezones.lookupViaCity(`${message.city}`);
        // timezone = cityLookup[0].timezone;
        for (const entry of cityLookup) {
          if (entry.timezone.includes(message.continent)) {
            timezone = entry.timezone;
            break;
          }
        }

        console.log(`The timezone for ${message.city} is ${timezone}`);

        const currentTimestamp = new Date().toISOString();
        const dateTimestamp = new Date(currentTimestamp);

        if (baseBDay) {
        
          const isoDateString = new Date(baseBDay).toISOString();
        
          const currentYear = new Date().getFullYear();
          const monthAndDay = isoDateString.slice(5, 10);

          const combinedDateTime = `${currentYear}-${monthAndDay}T09:00:00`;
          const localDateTime = DateTime.fromISO(combinedDateTime, { zone: timezone  });

          // Calculate the time until the scheduled email (in milliseconds)
          const timeUntilEmail = localDateTime.toMillis() - DateTime.now().toMillis();
          const timeLeft = formatTimeDifference(timeUntilEmail);
          console.log("User : ",message.email," have this Time Left:", timeLeft);
          if (timeUntilEmail <= 0 || timeUntilEmail < 60000 || timeUntilEmail < 0 || Number.isNaN(timeUntilEmail)) {

            try {
              // await prisma.$queryRaw`
              //   INSERT INTO "Message" ("userid", "message", "status", "city", "continent", "birthday", "email")
              //   VALUES (${user.id}, ${`Happy Birthday to ${fullName}`}, false, ${user.city}, ${user.continent}, ${newBday}, ${user.email})
              // `;
        
              // await prisma.$queryRaw`
              //   UPDATE "User"
              //   SET "gen_status" = true
              //   WHERE "id" = ${user.id} AND "email" = ${user.email}
              // `;
                          
            // Send a request to 'https://email-service.digitalenvision.com.au/send-email'
            const emailServiceResponse = await axios.post('https://email-service.digitalenvision.com.au/send-email', {
              email: message.email,
              message: `${message.message}`,
            });

            console.log('Email service response:', emailServiceResponse.data);

            if (emailServiceResponse.status === 200) {
              // Update the message status and sent_at using the user's email
              await prisma.$queryRaw`
                UPDATE "Message"
                SET "status" = true, "sent_at" = ${dateTimestamp}
                WHERE "email" = ${message.email}
              `;
              
              updateCount++; // Increment the update count if an update was made
            }
            } catch (error) {
              console.error(error)
              console.error(`Error processing user ${message.id}`);
            }

          } else {
            // console.error("User : ",user?.email ,"birthday ",user.birthday,"is not defined.");
          }
        }else{

        }
      }
    console.log(`Birthday messages sent to ${updateCount} users.`);
  } catch (error) {
    console.error('Error sending birthday messages:', error);
  }
}

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

cron.schedule('* * * * *', sendBirthdayMessages);
cron.schedule('* * * * *', sweepUnsentMessage);



app.use((req: Request, res: Response, next: Function) => {
  next(createError(404))
})

app.listen(3000, () =>
  console.log(`⚡️[server]: Server is running at https://localhost:3000`)
)

export default app; // Export the app instance (optional)
