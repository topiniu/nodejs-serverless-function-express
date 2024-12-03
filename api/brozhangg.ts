import type { VercelRequest, VercelResponse } from '@vercel/node'

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
// Key derivation function
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
}

async function encryptFile(filePath, password) {
    const content = await fs.readFile(filePath, 'utf8');

    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(16);
    const key = deriveKey(password, salt);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

async function decryptData(encryptedData, salt, iv, password) {
    const key = deriveKey(password, Buffer.from(salt, 'hex'));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

// Usage
async function main() {
    const password = 'topiniuuinipot1234567890';
    const filePath = path.join(__dirname, '../libs/result.js');

    try {
        const encrypted = await encryptFile(filePath, password);
        console.log('Encrypted:', encrypted);
        return encrypted

        // Simulating decryption (in real-world, this would be on the client-side)
        const decrypted = await decryptData(encrypted.encryptedData, encrypted.salt, encrypted.iv, password);
        console.log('Decrypted:', decrypted);
        return decrypted
    } catch (error) {
        console.error('Error:', error);
    }
}

main();



export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    const { name = 'World' } = req.query
    const encryptedJS = await main()
    console.log(encryptedJS)
    return res.json({
        message: encryptedJS,
    })
}
