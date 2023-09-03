# Project Setup with Docker, PostgreSQL, and Node.js

This guide outlines the steps to set up a project using Docker, PostgreSQL, Prisma for migrations, and a Node.js service. Follow these instructions to get your project up and running.

## Prerequisites

1. Ensure you have Docker installed on your system. If you don't have it, you can download and install it from [Docker's official website](https://www.docker.com/get-started).

2. Alternatively, if you have PostgreSQL already installed locally, you can adjust the environment variables and use the schema provided in the repository.

## Getting Started

### 1. Docker Compose Configuration

- Open the `docker-compose.yaml` file and adjust it according to your preferences. This file defines the services and configurations for your PostgreSQL container.

### 2. Compose the Docker Image

- Use the following command to compose the Docker image:

    ```bash
    docker-compose up -d
    ```

### 3. Verify Docker Container

- Confirm that the PostgreSQL container is running by checking its status with:

    ```bash
    docker ps
    ```

### 4. Environment Variables

- Modify the `.env` file in the `docker-compose.yaml` to match your desired environment configurations.

### 5. Install Node.js Dependencies

- Run the following command to install the Node.js project dependencies:

    ```bash
    npm install
    ```

### 6. Database Migration (Choose one method)

#### Option 1: Using Prisma

- If you prefer using Prisma for migrations, run the following command to create an initial migration:

    ```bash
    npx prisma migrate dev --name init
    ```

#### Option 2: Using .sql provided

- Alternatively, you can use the provided `.sql` file for database setup if you prefer not to use Prisma for migrations. Import the `.sql` file into your PostgreSQL database.

### 7. Run the Node.js Service

- Start the Node.js service by running:

    ```bash
    npm run dev
    ```

### 8. Testing with Postman

- A Postman collection is available for testing the API. You can import it into Postman to try out the endpoints.

---

You have successfully set up your project with Docker, PostgreSQL, Prisma (optional), and a Node.js service. Feel free to customize the project further according to your requirements.

Happy coding! 🚀
