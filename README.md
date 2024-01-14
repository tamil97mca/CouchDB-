# CouchDB Express API

This is a simple Express API for interacting with CouchDB. The API provides endpoints for user authentication, CRUD operations on documents, and live streaming using the `_changes` feed.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [CouchDB Methods](#couchdb-methods)
- [Token Verification Middleware](#token-verification-middleware)
- [Error Handling](#error-handling)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/your-repository.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Usage

1. Replace the CouchDB server URL and database name in `server.js`:

   ```javascript
   const couchdbUrl = "https://your-couchdb-server-url";
   const dbName = 'your_database_name';
   ```

2. Replace the secret key for JWT token in `server.js`:

   ```javascript
   const secretKey = 'your_secret_key';
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. The server will be running on [http://localhost:3000](http://localhost:3000).

## Endpoints

- **POST /login**
  - Authenticates a user based on email and password.

- **POST /insert-single**
  - Inserts a single document into the CouchDB database.

- **POST /insert-bulk**
  - Inserts multiple documents in bulk into the CouchDB database.

- **GET /all-docs**
  - Retrieves all documents with attachments from the CouchDB database.

- **POST /find**
  - Finds records with attachments based on a selector.

- **DELETE /delete/:id**
  - Deletes a record by ID from the CouchDB database.

- **PUT /update/:id**
  - Updates a record by ID in the CouchDB database.

- **GET /findone/:id**
  - Finds a single document by ID from the CouchDB database.

- **GET /changes**
  - Implements live streaming using the `_changes` feed.

## CouchDB Methods

The `couchdbMethods.js` file provides helper methods for interacting with CouchDB. These methods include:

- `getAllDocsWithAttachments`: Retrieves all documents with attachments from the database.
- `findRecordsWithAttachments`: Finds records with attachments based on a selector.
- `deleteRecordById(id)`: Deletes a record by ID from the database.
- `updateRecordById(id, updatedData)`: Updates a record by ID in the database.
- `insertSingleDocument(document)`: Inserts a single document into the database.
- `insertBulkDocuments(documents)`: Inserts multiple documents in bulk into the database.
- `findDocumentById(id)`: Finds a single document by ID from the database.

## Token Verification Middleware

The `verifyToken` middleware is used to verify JWT tokens for secure endpoints.

## Error Handling

The API includes error handling middleware to catch and handle internal server errors.

## Contributing

Feel free to contribute by opening issues or pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.