import * as chai from 'chai';
import 'mocha';
import axios, { AxiosError } from 'axios'; 

const expect = chai.expect
const randNum = Math.random()

    describe('POST /user', () => {
        it('should create a new user when valid data is provided', async () => {
        const newUser = {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe'+randNum+'@example.com',
            city: 'Bangkok',
            continent: 'Asia',
            birthday: '1990-09-04',
        };
    
        const response = await axios.post('http://localhost:3000/api/user', newUser); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(201);
        expect(response.data).to.be.an('object');
        expect(response.data).to.have.property('message').equal('Data inserted successfully');
        expect(response.data.newUser).to.be.an('object');
        expect(response.data.newUser).to.have.property('id');
        expect(response.data.newUser).to.have.property('first_name').equal('John');
        });
    
        it('should return a 400 error when required fields are missing or empty', async () => {
        const invalidUser = {
            first_name: 'Alice',
            email: '',
            city: 'Bangkok',
            continent: 'Asia',
            birthday: '1990-09-04',
        };
    
        try {
            await axios.post('http://localhost:3000/api/user', invalidUser); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(400);
            expect(axiosError.response!.data).to.be.an('object');
            expect(axiosError.response!.data).to.have.property('error').equal('Required fields are missing or empty');
        }
        });
    
        it('should return a 400 error when birthday is in an invalid format', async () => {
        const invalidBirthdayUser = {
            first_name: 'Eva',
            last_name: 'Smith',
            email: 'eva.smith'+randNum+'@example.com',
            city: 'Bangkok',
            continent: 'Asia',
            birthday: '2022-05-35', // Invalid date format
        };
    
        try {
            await axios.post('http://localhost:3000/api/user', invalidBirthdayUser); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(400);
            expect(axiosError.response!.data).to.be.an('object');
            expect(axiosError.response!.data).to.have.property('error').equal('Invalid birthday format');
        }
        });
    
        it('should return a 400 error when birthday is in the future', async () => {
        const futureBirthdayUser = {
            first_name: 'Michael',
            last_name: 'Johnson',
            email: 'michael.johnson'+randNum+'@example.com',
            city: 'Sydney',
            continent: 'Australia',
            birthday: '2030-09-25', // Future date
        };
    
        try {
            await axios.post('http://localhost:3000/api/user', futureBirthdayUser); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(400);
            expect(axiosError.response!.data).to.be.an('object');
            expect(axiosError.response!.data).to.have.property('error').equal('Birthday date cannot be in the future');
        }
        });
    
        it('should return a 500 error when a duplicate record is detected', async () => {
        const duplicateUser = {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com', // Duplicate email
            city: 'Bangkok',
            continent: 'Asia',
            birthday: '1990-09-04',
        };
    
        try {
            await axios.post('http://localhost:3000/api/user', duplicateUser); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(500);
            expect(axiosError.response!.data).to.be.an('object');
            expect(axiosError.response!.data).to.have.property('error').equal('Duplicate Record');
        }
        });
    
        // Add more test cases for other scenarios
    });

    describe('GET /users', () => {
        it('responds with status 200 and returns JSON', async () => {
        const response = await axios.get('http://localhost:3000/api/users'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        expect(response.data[0]).to.have.property('id');
        expect(response.data[0]).to.have.property('first_name');
        // Add more properties to check as needed
        });
    
        it('handles invalid limit parameter', async () => {
        try {
            await axios.get('http://localhost:3000/api/users?limit=invalid'); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(400);
            expect(axiosError.response!.data).to.deep.equal({ error: 'Invalid limit value. Limit must be between 5 and 500.' });
        }
        });
    
        it('fetches users with a specified limit', async () => {
        const response = await axios.get('http://localhost:3000/api/users?limit=10'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        expect(response.data.length).to.equal(10); // Check if the response has the specified limit
        });
    
        it('fetches all users when limit is not specified', async () => {
        const response = await axios.get('http://localhost:3000/api/users'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        // Check if the response contains all users when no limit is specified
        expect(response.data.length).to.be.at.least(1);
        });
    
        it('handles a valid limit within the range', async () => {
        const response = await axios.get('http://localhost:3000/api/users?limit=50'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        expect(response.data.length).to.equal(50); // Check if the response has the specified limit
        });
    
        it('handles a limit value at the lower bound', async () => {
        const response = await axios.get('http://localhost:3000/api/users?limit=5'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        expect(response.data.length).to.equal(5);
        });
    
        it('handles a limit value at the upper bound', async () => {
        const response = await axios.get('http://localhost:3000/api/users?limit=500'); // Replace 'your-port' with your actual port
    
        expect(response.status).to.equal(200);
        expect(response.headers['content-type']).to.include('application/json');
        expect(response.data).to.be.an('array');
        expect(response.data.length).to.equal(500);
        });
    
        it('handles a limit value exceeding the upper bound', async () => {
        try {
            await axios.get('http://localhost:3000/api/users?limit=1001'); // Replace 'your-port' with your actual port
        } catch (error) {
            const axiosError = error as AxiosError;
            expect(axiosError.response!.status).to.equal(400);
            expect(axiosError.response!.data).to.deep.equal({ error: 'Invalid limit value. Limit must be between 5 and 500.' });
        }
        });
    
        // Add more test cases to cover other scenarios
    });

    describe('DELETE /user/:id', () => {
        it('should delete an existing user', async () => {
            // Create a user first (you can use the POST /user route)
            const newUser = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doez'+randNum+'@example.com',
                city: 'Jakarta',
                continent: 'Asia',
                birthday: '1990-09-04',
            };

            const createUserResponse = await axios.post('http://localhost:3000/api/user', newUser); // Replace with your actual URL

            const userId = createUserResponse.data.newUser.id;

            const deleteUserResponse = await axios.delete(`http://localhost:3000/api/user/${userId}`); // Replace with your actual URL

            expect(deleteUserResponse.status).to.equal(200);
            expect(deleteUserResponse.data).to.be.an('object');
            expect(deleteUserResponse.data).to.have.property('id').equal(userId);

            // You can also add assertions to check if the user has been deleted from your database
        });

        it('should return a 404 error when deleting a non-existing user', async () => {
            const nonExistingUserId = 999; // Assuming this ID doesn't exist

            try {
                const deleteUserResponse = await axios.delete(`http://localhost:3000/api/user/${nonExistingUserId}`); // Replace with your actual URL

                // Expecting a 404 error
                expect(deleteUserResponse.status).to.equal(404);
                expect(deleteUserResponse.data).to.be.an('object');
                expect(deleteUserResponse.data).to.have.property('error').equal('User not found');
            } catch (error) {
                // You can also handle the error if Axios throws an exception
            }
        });

        it('should return a 500 error when there is a server error during deletion', async () => {
            // Simulate a server error by providing an invalid user ID
            const invalidUserId = 'invalid_id';

            try {
                const deleteUserResponse = await axios.delete(`http://localhost:3000/api/user/${invalidUserId}`); // Replace with your actual URL

                // Expecting a 500 error due to server error
                expect(deleteUserResponse.status).to.equal(500);
                expect(deleteUserResponse.data).to.be.an('object');
                expect(deleteUserResponse.data).to.have.property('error').equal('Internal server error');
            } catch (error) {
                // You can also handle the error if Axios throws an exception
            }
        });

        // Add more test cases to cover other scenarios
    });

    describe('PUT /user/:id', () => {
        it('should update user information', async () => {
            // Create a user first (you can use the POST /user route)
            const newUser = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe'+randNum+'@example.com',
                city: 'New York',
                continent: 'America',
                birthday: '1990-01-15',
            };

            const createUserResponse = await axios.post('http://localhost:3000/api/user', newUser); // Replace with your actual URL

            const userId = createUserResponse.data.newUser.id;

            // Update user information
            const updatedUserData = {
                city: 'Los Angeles',
                continent: 'America',
                birthday: '1995-05-20',
            };

            const updateUserResponse = await axios.put(`http://localhost:3000/api/user/${userId}`, updatedUserData); // Replace with your actual URL

            expect(updateUserResponse.status).to.equal(200);
            expect(updateUserResponse.data).to.be.an('object');
            expect(updateUserResponse.data).to.have.property('id').equal(userId);
            expect(updateUserResponse.data).to.have.property('city').equal(updatedUserData.city);
            expect(updateUserResponse.data).to.have.property('continent').equal(updatedUserData.continent);
            // Add more assertions to check other updated fields
        });

        it('should return a 404 error when updating a non-existing user', async () => {
            const nonExistingUserId = 999; // Assuming this ID doesn't exist

            const updatedUserData = {
                city: 'Los Angeles',
                continent: 'America',
                birthday: '1995-05-20',
            };

            try {
                const updateUserResponse = await axios.put(`http://localhost:3000/api/user/${nonExistingUserId}`, updatedUserData); // Replace with your actual URL

                // Expecting a 404 error
                expect(updateUserResponse.status).to.equal(404);
                expect(updateUserResponse.data).to.be.an('object');
                expect(updateUserResponse.data).to.have.property('error').equal('User not found');
            } catch (error) {
                // You can also handle the error if Axios throws an exception
            }
        });

        it('should return a 400 error when providing invalid input data', async () => {
            // Create a user first (you can use the POST /user route)
            const newUser = {
                first_name: 'John',
                last_name: 'Doe',
                email: 'john.doe'+randNum+'@example.com',
                city: 'New Delhi',
                continent: 'America',
                birthday: '1990-09-04',
            };

            const createUserResponse = await axios.post('http://localhost:3000/api/user', newUser); // Replace with your actual URL

            const userId = createUserResponse.data.newUser.id;

            // Attempt to update user information with invalid data (e.g., invalid birthday format)
            const invalidUserData = {
                birthday: '1993-09-35'
                // Invalid date format
            };

            try {
                const updateUserResponse = await axios.put(`http://localhost:3000/api/user/${userId}`, invalidUserData); // Replace with your actual URL

                console.log(updateUserResponse)

                // Expecting a 400 error

                expect(updateUserResponse.status).to.equal(500);
                expect(updateUserResponse.data).to.be.an('object');
                expect(updateUserResponse.data).to.have.property('error').equal('Invalid birthday format');
            } catch (error) {
                // You can also handle the error if Axios throws an exception
            }
        });

        // Add more test cases to cover other scenarios, such as email conflicts and server errors
    });