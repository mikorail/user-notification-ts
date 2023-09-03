First Thing First make sure you have docker or have postgresql installed locally 
if you have postgresql locally just change the env variables and use the schema and seed provided on the repo
once you have docker
1. check the docker-compose.yaml and adjust it to your preference
2. compose the image
        docker compose up -d
3. check if its exist using 
    docker ps
4. adjust the .env to your liking in docker-compose.yaml
5. do npm install and do npm run dev
6. do npx prisma migrate dev --name init if you want to migrate by using prisma or just use the .sql provided it's up to you
7. run the service using npm run dev

also theres a postman collection if you want to try 
