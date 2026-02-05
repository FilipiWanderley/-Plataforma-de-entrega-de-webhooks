const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.text({ type: '*/*' })); // Accept any content type as text/string if not JSON

// In-memory store for requests
const MAX_HISTORY = 100;
let requestHistory = [];

// GET /requests - List recent requests
app.get('/requests', (req, res) => {
    res.json(requestHistory);
});

// DELETE /requests - Clear history
app.delete('/requests', (req, res) => {
    requestHistory = [];
    res.json({ message: 'History cleared' });
});

// POST /webhook/:status - Receive webhook
// Params: :status (200, 400, 500, etc.)
// Query: timeout (ms) - simulate delay
app.post('/webhook/:status', async (req, res) => {
    const status = parseInt(req.params.status) || 200;
    const timeout = parseInt(req.query.timeout) || 0;
    const receivedAt = new Date().toISOString();

    const requestRecord = {
        id: crypto.randomUUID(),
        receivedAt,
        method: req.method,
        path: req.originalUrl,
        statusResponse: status,
        headers: req.headers,
        query: req.query,
        body: req.body
    };

    // Add to history
    requestHistory.unshift(requestRecord);
    if (requestHistory.length > MAX_HISTORY) {
        requestHistory.pop();
    }

    console.log(`[${receivedAt}] Received POST ${req.originalUrl} - Responding with ${status} after ${timeout}ms`);

    if (timeout > 0) {
        await new Promise(resolve => setTimeout(resolve, timeout));
    }

    res.status(status).json({
        message: `Mock response with status ${status}`,
        received_request: {
            headers: req.headers,
            body: req.body
        }
    });
});

// Default POST handler if no status specified (defaults to 200)
app.post('/webhook', (req, res) => {
    res.redirect(307, '/webhook/200');
});

app.listen(PORT, () => {
    console.log(`Mock Receiver running on port ${PORT}`);
    console.log(`- POST /webhook/{status}?timeout={ms}`);
    console.log(`- GET /requests`);
});
