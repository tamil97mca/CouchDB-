const nano = require('nano');

const baseURL = "https://apikey-v2-1xzbb618xtgfg14nm7uasm9coajsc9dzzpg8p57atbtg:f56766c5716a7b37a531aaa7bdb53315@8ca8138b-1aac-430a-8325-3a686242a515-bluemix.cloudantnosqldb.appdomain.cloud";
const couchdbUrl = baseURL;
const couchdb = nano(couchdbUrl);

const dbName = 'sms_student_list';
const db = couchdb.use(dbName);

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
            console.log(`Database '${dbName}' already exists.`);
        } else {
            await couchdb.db.create(dbName);
            console.log(`Database '${dbName}' created.`);
        }
    } catch (error) {
        console.error('Error setting up database:', error);
        process.exit(1);
    }
}

async function getAllDocsWithAttachments() {
    try {
        const allDocs = await db.list({ include_docs: true, attachments: true });
        const docsWithAttachments = await Promise.all(allDocs.rows.map(async (row) => {
            const doc = row.doc;
            const attachments = doc._attachments || {};

            const attachmentData = {};
            await Promise.all(Object.keys(attachments).map(async (attachmentName) => {
                const data = await db.attachment.get(doc._id, attachmentName);
                attachmentData[attachmentName] = data.toString('base64');
            }));

            return { ...doc, attachments: attachmentData };
        }));
        return docsWithAttachments;
    } catch (error) {
        throw error;
    }
}

async function findRecordsWithAttachments(selector) {
    try {
        const result = await db.find({ selector, attachments: true });
        const docsWithAttachments = result.docs.map(doc => {
            const attachments = doc._attachments || {};
            return { ...doc, attachments };
        });
        return docsWithAttachments;
    } catch (error) {
        throw error;
    }
}

async function deleteRecordById(id) {
    try {
        const doc = await db.get(id, { attachments: true });
        const result = await db.destroy(doc._id, doc._rev);
        return result;
    } catch (error) {
        throw error;
    }
}

async function updateRecordById(id, updatedData) {
    try {
        const doc = await db.get(id, { attachments: true });
        const updatedDoc = { ...doc, ...updatedData };

        const result = await db.insert(updatedDoc);
        return result;
    } catch (error) {
        throw error;
    }
}

async function insertSingleDocument(document) {
    try {
        const result = await db.insert(document);
        return result;
    } catch (error) {
        throw error;
    }
}

async function insertBulkDocuments(documents) {
    try {
        const result = await db.bulk({ docs: documents });
        return result;
    } catch (error) {
        throw error;
    }
}

async function findDocumentById(id) {
    try {
        const doc = await db.get(id, { attachments: true });
        const attachments = {};

        if (doc._attachments) {
            for (const attachmentName in doc._attachments) {
                if (doc._attachments.hasOwnProperty(attachmentName)) {
                    attachments[attachmentName] = {
                        content_type: doc._attachments[attachmentName].content_type,
                        data: doc._attachments[attachmentName].data
                    };
                }
            }
        }

        return { ...doc, attachments };
    } catch (error) {
        throw error;
    }
}

async function insertSingleAttachment(docId, attachmentName, attachmentData, attachmentType) {
    try {
        const doc = await db.get(docId);

        let dataBuffer;
        if (Buffer.isBuffer(attachmentData)) {
            dataBuffer = attachmentData;
        } else if (typeof attachmentData === 'string') {
            const base64Data = attachmentData.replace(/^data:image\/\w+;base64,/, '');
            dataBuffer = Buffer.from(base64Data, 'base64');
        } else if (typeof attachmentData === 'object' && attachmentData instanceof ArrayBuffer) {
            dataBuffer = Buffer.from(attachmentData);
        } else {
            throw new Error('Invalid attachmentData type');
        }

        const result = await db.attachment.insert(docId, attachmentName, dataBuffer, attachmentType, { rev: doc._rev });

        return result;
    } catch (error) {
        throw error;
    }
}

async function fetchAttachmentsByDocId(docId) {
    try {
        const doc = await db.get(docId, { attachments: true });
        const attachments = {};

        if (doc._attachments) {
            for (const attachmentName in doc._attachments) {
                if (doc._attachments.hasOwnProperty(attachmentName)) {
                    attachments[attachmentName] = {
                        content_type: doc._attachments[attachmentName].content_type,
                        data: doc._attachments[attachmentName].data,
                    };
                    const fullData = await fetchAttachmentContent(docId, attachmentName);
                    attachments[attachmentName].fullData = fullData;
                }
            }
        }

        return attachments;
    } catch (error) {
        throw error;
    }
}

async function fetchAttachmentContent(docId, attachmentName) {
    try {
        const result = await db.attachment.get(docId, attachmentName);
        return {
            type: result.contentType,
            data: result.toString('base64'),
        };
    } catch (error) {
        throw error;
    }
}


module.exports = {
    setupDatabase,
    getAllDocsWithAttachments,
    findRecordsWithAttachments,
    deleteRecordById,
    updateRecordById,
    insertSingleDocument,
    insertBulkDocuments,
    findDocumentById,
    insertSingleAttachment,
    fetchAttachmentsByDocId
};
