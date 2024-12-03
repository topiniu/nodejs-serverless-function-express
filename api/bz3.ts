import type { VercelRequest, VercelResponse } from '@vercel/node'
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

function encryptData(data, password) {
    // Generate a random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    
    // Derive key using password and salt
    const key = deriveKey(password, salt);
    
    // Create cipher and encrypt
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return encrypted data with salt and iv for decryption
    return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex')
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Get the origin from the request headers
    const origin = req.headers.origin || '';
    const allowedOrigins = [
        'http://127.0.0.1:8081',
        'http://localhost:8081',
        'http://127.0.0.1:8000',
        'http://localhost:8000'
    ];

    // Check if the origin is allowed
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.status(200).end();
        return;
    }

    const filePath = path.join(__dirname, '../sources/pixel_data_1.json');
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }

        try {
            const pixels = JSON.parse(data);
            console.log('[]', pixels.length);

            const password = 'aaakuangbaokouhaiguaizhangge';
            
            // Add a small delay between sends to prevent overwhelming the client
            for (const pixel of pixels) {
                const encryptedData = encryptData(JSON.stringify(pixel), password);
                res.write(`data: ${JSON.stringify(encryptedData)}\n\n`);
                
                // Optional: Add a small delay between sends
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            res.end();
        } catch (error) {
            console.error('Processing error:', error);
            res.status(500).send('Error processing data');
        }
    });
}
