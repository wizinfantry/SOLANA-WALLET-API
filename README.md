-----

# Solana Wallet API

This repository provides a convenient Node.js Express API for interacting with the Solana blockchain. It allows you to manage Solana wallets, check balances of both native SOL and SPL tokens, and facilitate transactions. This API is built using the official Solana Web3.js library and `bs58` for Base58 encoding/decoding of private keys.

-----

### Key Features

  * **Wallet Management**:
      * **Create New Wallets**: Generate new Solana keypairs and obtain their public and Base58-encoded private keys.
      * **Load Existing Wallets**: Reconstruct a wallet using a provided Base58-encoded private key.
  * **Balance Inquiry**:
      * **Get SOL Balance**: Check the native SOL balance for any public key.
      * **Get SPL Token Balance**: Retrieve the balance of any SPL token for a given public key and token address.
  * **Transaction Handling**:
      * **Send SOL**: Transfer native SOL from one wallet to another.
      * **Send SPL Tokens**: Send specified amounts of an SPL token to a recipient.

-----

### Major Enhancements

1.  **Private Key Handling**: The API now robustly handles private keys in **Base58** format, which is the standard encoding used in the Solana ecosystem. This ensures compatibility and consistency.
2.  **Flexible Cluster Configuration**: The Solana connection is initially set to `devnet`, but it's designed to be easily switched to other clusters like `mainnet-beta` or `testnet` by modifying the `clusterApiUrl` parameter.
3.  **Enhanced Error Handling**: The API includes improved error handling for various requests, providing clearer error messages for better debugging and client-side feedback.
4.  **SPL Token Decimal Handling**: When sending SPL tokens, the API accounts for token decimal places by multiplying the human-readable amount by `10^9`. While this assumes 9 decimals (common for many SPL tokens), for production use, it's recommended to dynamically fetch the token's actual decimals.

-----

### Installation

To set up and run this API, you'll need **Node.js** and **npm** (Node Package Manager) installed on your system.

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/wizinfantry/SOLANA-WALLET-API.git
    cd SOLANA-WALLET-API
    ```

2.  **Install dependencies**:

    ```bash
    npm install express body-parser @solana/web3.js @solana/spl-token bs58
    ```

-----

### API Endpoints

The API exposes the following `POST` endpoints:

#### 1\. Create New Wallet

  * **Endpoint**: `/create-wallet`
  * **Method**: `POST`
  * **Description**: Generates a new Solana keypair.
  * **Request Body**: (None)
  * **Response**:
    ```json
    {
      "publicKey": "new-wallet-public-key-base58",
      "privateKey": "new-wallet-private-key-base58"
    }
    ```

#### 2\. Create Wallet from Private Key

  * **Endpoint**: `/create-wallet-with-private-key`
  * **Method**: `POST`
  * **Description**: Derives a public key from a provided Base58-encoded private key.
  * **Request Body**:
    ```json
    {
      "privateKey": "your-private-key-base58"
    }
    ```
  * **Response**:
    ```json
    {
      "publicKey": "derived-public-key-base58",
      "privateKey": "your-private-key-base58"
    }
    ```

#### 3\. Get SOL Balance

  * **Endpoint**: `/get-sol-balance`
  * **Method**: `POST`
  * **Description**: Fetches the native SOL balance for a given public key.
  * **Request Body**:
    ```json
    {
      "publicKey": "wallet-public-key-base58"
    }
    ```
  * **Response**:
    ```json
    {
      "publicKey": "wallet-public-key-base58",
      "balance": 1.23456789 // SOL amount
    }
    ```

#### 4\. Send SOL

  * **Endpoint**: `/send-sol`
  * **Method**: `POST`
  * **Description**: Transfers a specified amount of SOL from one wallet to another.
  * **Request Body**:
    ```json
    {
      "fromPrivateKey": "sender-private-key-base58",
      "toPublicKey": "recipient-public-key-base58",
      "amount": 0.01 // Amount in SOL
    }
    ```
  * **Response**:
    ```json
    {
      "transactionSignature": "transaction-signature-base58"
    }
    ```

#### 5\. Get SPL Token Balance

  * **Endpoint**: `/get-spl-balance`
  * **Method**: `POST`
  * **Description**: Retrieves the balance of a specific SPL token for a given wallet.
  * **Request Body**:
    ```json
    {
      "publicKey": "wallet-public-key-base58",
      "tokenAddress": "spl-token-mint-address-base58"
    }
    ```
  * **Response**:
    ```json
    {
      "publicKey": "wallet-public-key-base58",
      "tokenAddress": "spl-token-mint-address-base58",
      "balance": 100.5 // Token amount (UI amount, adjusted for decimals)
    }
    ```

#### 6\. Send SPL Token

  * **Endpoint**: `/send-spl-token`
  * **Method**: `POST`
  * **Description**: Transfers a specified amount of an SPL token from one wallet to another.
  * **Request Body**:
    ```json
    {
      "fromPrivateKey": "sender-private-key-base58",
      "toPublicKey": "recipient-public-key-base58",
      "amount": 100, // Amount in token's UI units (e.g., 100 tokens)
      "tokenAddress": "spl-token-mint-address-base58"
    }
    ```
  * **Response**:
    ```json
    {
      "transactionSignature": "transaction-signature-base58"
    }
    ```

-----

### How to Run

1.  **Start the server**:
    ```bash
    node solanaWalletServer.js
    ```
    *The server will start on `http://localhost:7994`.*

-----

### Important Security Notes

  * **Private Key Exposure**: **NEVER hardcode private keys in your production applications or commit them directly to public repositories.** For secure handling in a production environment, always use environment variables, dedicated key management solutions, or hardware security modules (HSMs). The examples here use direct private keys for demonstration purposes only.
  * **Network Selection**: The provided `providerUrl` defaults to Solana's `devnet`. For real-world applications, ensure you switch to `mainnet-beta` when ready for production.
  * **Error Handling**: While basic `try-catch` blocks are implemented, a robust production API would require more comprehensive error handling, logging, and user-friendly error messages.
  * **SPL Token Decimals**: The `send-spl-token` endpoint currently assumes a fixed decimal place (9). For robust applications handling various SPL tokens, you should dynamically fetch the `decimals` property from the token's mint account using `connection.getParsedAccountInfo` on the `tokenAddress`.

-----

### Contributing

Feel free to fork this repository, open issues for bugs or feature requests, or submit pull requests with improvements\!

-----
