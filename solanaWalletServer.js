import express from 'express';
import bodyParser from 'body-parser';
import { Keypair, Connection, clusterApiUrl, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import bs58 from 'bs58'; // Library for Base58 encoding/decoding

const app = express();
const port = 7994;

// Body-parser setup for parsing JSON request bodies
app.use(bodyParser.json());

// Solana connection setup. Currently set to Devnet, but can be changed to other clusters.
// e.g., clusterApiUrl('mainnet-beta'), 'confirmed' for commitment level
const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

// 1. Wallet Creation API (POST)
// Generates a new Solana keypair and returns its public and private keys (Base58 encoded).
app.post('/create-wallet', (req, res) => {
    try {
        const keypair = Keypair.generate();
        const privateKey = bs58.encode(keypair.secretKey); // Private key in Base58 format
        const publicKey = keypair.publicKey.toBase58();   // Public key in Base58 format

        res.json({
            publicKey: publicKey,
            privateKey: privateKey
        });
    } catch (error) {
        console.error("Error creating wallet:", error);
        res.status(500).send('Error creating wallet');
    }
});

// 2. Wallet Creation API (with provided Private Key, POST)
// Loads a wallet from a given Base58 encoded private key.
app.post('/create-wallet-with-private-key', (req, res) => {
    try {
        const { privateKey } = req.body;
        if (!privateKey) {
            return res.status(400).send('Private key is required.');
        }
        const secretKey = bs58.decode(privateKey); // Decode Base58 private key
        const keypair = Keypair.fromSecretKey(secretKey);
        const publicKey = keypair.publicKey.toBase58();

        res.json({
            publicKey: publicKey,
            privateKey: privateKey // Return the provided private key for confirmation
        });
    } catch (error) {
        console.error("Error creating wallet with private key:", error);
        res.status(500).send('Error creating wallet with private key');
    }
});

// 3. Get SOL Balance API (POST)
// Retrieves the native SOL balance for a given public key.
app.post('/get-sol-balance', async (req, res) => {
    try {
        const { publicKey } = req.body;
        if (!publicKey) {
            return res.status(400).send('Public key is required.');
        }
        const publicKeyObj = new PublicKey(publicKey);
        const balance = await connection.getBalance(publicKeyObj);
        res.json({
            publicKey: publicKey,
            balance: balance / LAMPORTS_PER_SOL // Convert balance from Lamports to SOL
        });
    } catch (error) {
        console.error("Error fetching SOL balance:", error);
        res.status(500).send('Error fetching SOL balance');
    }
});

// 4. Send SOL API (POST)
// Sends native SOL from one address to another.
app.post('/send-sol', async (req, res) => {
    try {
        const { fromPrivateKey, toPublicKey, amount } = req.body;
        if (!fromPrivateKey || !toPublicKey || amount === undefined || amount <= 0) {
            return res.status(400).send('Missing required fields: fromPrivateKey, toPublicKey, or amount must be a positive number.');
        }

        const fromSecretKey = bs58.decode(fromPrivateKey); // Decode Base58 private key
        const fromKeypair = Keypair.fromSecretKey(fromSecretKey);

        const toPublicKeyObj = new PublicKey(toPublicKey);
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toPublicKeyObj,
                lamports: amount * LAMPORTS_PER_SOL // Convert SOL amount to Lamports
            })
        );

        // Sign and send the transaction
        const signature = await connection.sendTransaction(transaction, [fromKeypair]);
        await connection.confirmTransaction(signature); // Wait for transaction confirmation

        res.json({ transactionSignature: signature });
    } catch (error) {
        console.error("Error sending SOL:", error);
        res.status(500).send('Error sending SOL');
    }
});

// 5. Get SPL Token Balance API (POST)
// Retrieves the balance of a specific SPL token for a given public key.
app.post('/get-spl-balance', async (req, res) => {
    try {
        const { publicKey, tokenAddress } = req.body;
        if (!publicKey || !tokenAddress) {
            return res.status(400).send('Missing required fields: publicKey or tokenAddress.');
        }

        const publicKeyObj = new PublicKey(publicKey);
        const tokenAddressObj = new PublicKey(tokenAddress);

        // Query Solana to get SPL token accounts owned by the public key for the specific mint
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKeyObj, {
            mint: tokenAddressObj
        });

        // Extract the UI amount (human-readable balance) from the first found token account, or 0 if none.
        const balance = tokenAccounts.value.length > 0
            ? tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount
            : 0;

        res.json({
            publicKey: publicKey,
            tokenAddress: tokenAddress,
            balance: balance
        });
    } catch (error) {
        console.error("Error fetching SPL balance:", error);
        res.status(500).send('Error fetching SPL balance');
    }
});

// 6. Send SPL Token API (POST)
// Sends a specified amount of an SPL token from one address to another.
app.post('/send-spl-token', async (req, res) => {
    try {
        const { fromPrivateKey, toPublicKey, amount, tokenAddress } = req.body;
        if (!fromPrivateKey || !toPublicKey || amount === undefined || amount <= 0 || !tokenAddress) {
            return res.status(400).send('Missing required fields: fromPrivateKey, toPublicKey, amount (positive number), or tokenAddress.');
        }

        const fromSecretKey = bs58.decode(fromPrivateKey); // Decode Base58 private key
        const fromKeypair = Keypair.fromSecretKey(fromSecretKey);

        const toPublicKeyObj = new PublicKey(toPublicKey);
        const tokenAddressObj = new PublicKey(tokenAddress);

        // Get or create the associated token accounts for both sender and receiver
        // Note: receiver's associated token account might need to be created if it doesn't exist.
        const fromTokenAccount = await getAssociatedTokenAddress(tokenAddressObj, fromKeypair.publicKey);
        const toTokenAccount = await getAssociatedTokenAddress(tokenAddressObj, toPublicKeyObj);

        // Create the transaction for SPL token transfer
        const transaction = new Transaction().add(
            createTransferInstruction(
                fromTokenAccount,
                toTokenAccount,
                fromKeypair.publicKey,
                amount * Math.pow(10, 9), // Convert token amount to raw units based on decimals (assuming 9 decimals for simplicity)
                                         // For production, you should dynamically fetch token decimals using `getMint` or similar.
                [], // Signers besides the owner, if any
                TOKEN_PROGRAM_ID // The program ID for SPL Token
            )
        );

        // Sign and send the transaction
        const signature = await connection.sendTransaction(transaction, [fromKeypair]);
        await connection.confirmTransaction(signature); // Wait for transaction confirmation

        res.json({ transactionSignature: signature });
    } catch (error) {
        console.error("Error sending SPL token:", error);
        res.status(500).send('Error sending SPL token');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Solana Wallet API Server is running at http://localhost:${port}`);
});
