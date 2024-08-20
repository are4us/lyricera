const { Hbar, Client } = require("@hashgraph/sdk");
require("dotenv").config();

/**
 * get AccountId used for subsequent activities
 * @returns {object} account_id - account id used for subsequent activities. In the ECDSA Format
 */
function get_account_id() {
    return process.env.ACCOUNT_ID;
}
/**
 * get Account Private Key used for subsequent activities
 * @returns {object} account_private_key - account private key used for subsequent activities. In the ECDSA Format
 */
function get_account_private_key() {
    return process.env.ACCOUNT_PRIVATE_KEY;
}
/**
 * Connecting to the Hedera Network
 * @returns {object} client - A valid client connection to the Hedera Test network.
 */

async function initiate_connection() {
    try {
        //Grab your Hedera testnet account ID and private key from your .env file
        const myAccountId = get_account_id();
        const myPrivateKey = get_account_private_key();

        //Create your Hedera Testnet client
        //Could improve by offering different types of networks, e.g. production, previewnet, local, test, ...
        const client = Client.forTestnet();

        //Set your account as the client's operator
        client.setOperator(myAccountId, myPrivateKey);

        //Set the default maximum transaction fee (in Hbar)
        client.setDefaultMaxTransactionFee(new Hbar(100));

        //Set the maximum payment for queries (in Hbar)
        client.setMaxQueryPayment(new Hbar(50));

        // If we weren't able to grab it, we should throw a new error
        if (!myAccountId || !myPrivateKey) {
            throw new Error("Environment variables ACCOUNT_ID and ACCOUNT_PRIVATE_KEY must be present");
        }

        return client;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

/**
 * Closing connection to the Hedera network
 * @param {object} client - Client connection to the Hedera Network, which will be closed.
 */
async function stop_connection(client) {
    try {
        client.close();
        console.log('Client Connection to the Hedera network has been closed.');
    } catch (error) {
        console.error("Error closing client connection:", error);
    }
}

module.exports = {
    initiate_connection,
    stop_connection,
    get_account_id,
    get_account_private_key
}