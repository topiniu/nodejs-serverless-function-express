// @ts-nocheck
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

    // @ts-ignore
    const filePath = path.join(__dirname, '../sources/pixel_data_1.json');
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )

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
                // const encryptedData = encryptData(JSON.stringify(pixel), password);
                // res.write(`data: ${JSON.stringify(encryptedData)}\n\n`);
                res.write(`data: ${JSON.stringify(pixel)}\n\n`);
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
