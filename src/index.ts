import { PrismaClient,Prisma } from "@prisma/client";
import express, { Request, Response } from "express";
import createError from "http-errors"
import { DateTime } from 'luxon';
import userRouter from './routes/UserRoutes';
import { UserModel } from "./model/UserModel";
import { MessageModel } from "./model/MessageModel";

var cityTimezones = require('city-timezones');


const prisma = new PrismaClient({
  // log: ['query'], // Enable query logging
});
const app = express()

const axios = require('axios'); // Import the Axios library

const cron = require('node-cron');


app.use(express.json())

app.use('/api', userRouter);

const sendBirthdayMessages = async () => {
  console.log("hit")
  try {
    let updateCount = 0; // Initialize the count for update operations

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // Get the current month (adding 1 because months are 0-indexed)
    const currentDay = today.getDate(); // Get the current day of the month
    
    const usersWithSameBirthday : UserModel[] = await prisma.$queryRaw`
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
    
    const messageWithSameBirthday : MessageModel[] = await prisma.$queryRaw`
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
