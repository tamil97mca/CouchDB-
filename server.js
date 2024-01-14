const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nano = require('nano');
const couchdbMethods = require('./api/couchdbMethods');

const app = express();
const port = 3000;
const secretKey = '!@#$%^&';

app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'image/*', limit: '10mb' }));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

const baseURL = "https://apikey-v2-1xzbb618xtgfg14nm7uasm9coajsc9dzzpg8p57atbtg:f56766c5716a7b37a531aaa7bdb53315@8ca8138b-1aac-430a-8325-3a686242a515-bluemix.cloudantnosqldb.appdomain.cloud";
const couchdbUrl = baseURL;
const couchdb = nano(couchdbUrl);

const dbName = 'sms_login_user';

async function setupDatabase() {
    try {
        let dbExists = false;

        try {
            await couchdb.db.get(dbName);
            dbExists = true;
        } catch (err) {
            if (err.statusCode !== 404) {
                throw err; 
            }
        }

        console.log("dbExists", dbExists);

        if (dbExists) {
            await createIndex();
            await couchdbMethods.setupDatabase();
            console.log(`Database '${dbName}' already exists.`);
        } else {
            await couchdb.db.create(dbName);
            await createIndex();
            await couchdbMethods.setupDatabase();
            console.log(`Database '${dbName}' created.`);
        }
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1); 
    }
}

const indexDefinition = {
    index: {
        fields: ['email']
    },
    name: 'email-index',
    type: 'json'
};

async function createIndex() {
    try {
        await db.createIndex(indexDefinition);
        console.log('Index created successfully');
    } catch (error) {
        console.error('Error creating index:', error);
    }
}

setupDatabase();

const db = couchdb.use(dbName);

app.get('/', async(req, res) => {
    res.send("<h1>Service is live...</h1>")
})

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.find({
            selector: {
                email: { $eq: email },
                password: { $eq: password },
            },
            limit: 1,
        });

        if (result.docs.length > 0) {
            const user = result.docs[0];

            if (user.password === password) {
                const token = jwt.sign({ userId: user._id, email: user.email }, secretKey, { expiresIn: '30m' });

                res.json({ token, result });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/register', async (req, res) => {
    const { email, password, role } = req.body;

    try {
        const existingUser = await db.find({
            selector: {
                email: { $eq: email },
            },
            limit: 1,
        });

        if (existingUser.docs.length > 0) {
            res.status(400).json({ message: 'User with this email already exists' });
            return;
        }

        const newUser = {
            email,
            password,
            role
        };

        const result = await db.insert(newUser);

        res.status(201).json({ message: 'User registered successfully', result });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/insert-single', async (req, res) => {
    const document = req.body;

    try {
        const result = await couchdbMethods.insertSingleDocument(document);
        res.json(result);
    } catch (error) {
        console.error('Error inserting single document:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/insert-bulk', async (req, res) => {
    const documents = req.body;

    try {
        const result = await couchdbMethods.insertBulkDocuments(documents);
        res.json(result);
    } catch (error) {
        console.error('Error inserting bulk documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/all-docs', async (req, res) => {
    try {
        const docs = await couchdbMethods.getAllDocsWithAttachments();
        res.json(docs);
    } catch (error) {
        console.error('Error getting all documents:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/find', async (req, res) => {
    const selector = req.body.selector;

    try {
        const docs = await couchdbMethods.findRecordsWithAttachments(selector);
        res.json(docs);
    } catch (error) {
        console.error('Error finding records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/delete/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const result = await couchdbMethods.deleteRecordById(id);
        res.json({ message: 'Record deleted successfully', result });
    } catch (error) {
        console.error('Error deleting record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/update/:id', async (req, res) => {
    const id = req.params.id;
    const updatedData = req.body;

    try {
        const result = await couchdbMethods.updateRecordById(id, updatedData);
        res.json({ message: 'Record updated successfully', result });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/findone/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const singleDoc = await couchdbMethods.findDocumentById(id);
        if (singleDoc) {
            res.json(singleDoc);
        } else {
            res.status(404).json({ message: 'Document not found' });
        }
    } catch (error) {
        console.error('Error finding document by ID:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/attachments/:id', async (req, res) => {
    const docId = req.params.id;

    try {
        const attachments = await couchdbMethods.fetchAttachmentsByDocId(docId);
        res.json({ attachments });
    } catch (error) {
        console.error('Error fetching attachments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.put('/insert-single-attachment/:id', async (req, res) => {
    const docId = req.params.id;
    const imageData = req.body.image;
    const imageType = req.headers['content-type'];

    try {
        const attachmentResult = await couchdbMethods.insertSingleAttachment(docId, 'image', imageData, imageType);

        res.json({ attachmentResult });
    } catch (error) {
        console.error('Error inserting attachment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});




app.get('/changes', (req, res) => {
    const changesFeed = db.follow({ since: 'now', include_docs: true, live: true });

    changesFeed.on('change', (change) => {
        res.write(`data: ${JSON.stringify(change)}\n\n`);
    });

    changesFeed.on('error', (err) => {
        console.error('Error in _changes feed:', err);
        res.status(500).end();
    });

    req.on('close', () => {
        changesFeed.stop();
        res.end();
    });
});

function verifyToken(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(403).json({ message: 'Token is missing' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token has expired', expired: true });
            } else {
                return res.status(401).json({ message: 'Invalid token' });
            }
        }

        req.user = decoded;
        next();
    });
}


app.all('*', (req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
