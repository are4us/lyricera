const { PrivateKey, AccountCreateTransaction, AccountBalanceQuery, Hbar } = require("@hashgraph/sdk");
const { initiate_connection, stop_connection } = require("./common-hdr-functions");
// require("dotenv").config();

/**
 * Create a new Hedera account
 * @returns {Object} newAccount - A JSON representation of the newly created account, including: privateKey, publicKey and accountID.
 */
async function create_account() {
    try {
        const client = await initiate_connection();

        // Starting the new Account creation process.
        const newAccountPrivateKey = await PrivateKey.generateECDSA();  //switched to use ECDSA keys
        const newAccountPublicKey = newAccountPrivateKey.publicKey;

        const transactionResponse = await new AccountCreateTransaction()
            .setKey(newAccountPublicKey)
            .setInitialBalance(Hbar.fromTinybars(1000))
            .execute(client);

        // Get the receipt of the transaction
        const receipt = await transactionResponse.getReceipt(client);

        // Get the new account ID
        const newAccountId = receipt.accountId;

        const newAccount = {
            privateKey: newAccountPrivateKey.toString(),
            publicKey: newAccountPublicKey.toString(),
            accountID: newAccountId.toString()
        }

        console.log('Successfully created a new hdr account: ');
        console.log("The new account ID is: ", newAccount.accountID);
        console.log("The new account private key is: ", newAccount.privateKey);
        console.log("The new account public key is: ", newAccount.publicKey);

        // Verify the account balance
        const accountBalance = await new AccountBalanceQuery()
            .setAccountId(newAccountId)
            .execute(client);

        const balance = accountBalance.hbars.toTinybars() + " tinybar. ";           

        stop_connection(client);
     
        return newAccount;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

module.exports = {create_account}