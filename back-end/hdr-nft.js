const { Client, PrivateKey, AccountBalanceQuery,
    Hbar, TokenType, TokenCreateTransaction, TokenSupplyType,
    AccountId, TokenMintTransaction,
    TokenNftInfoQuery, TransferTransaction, TokenAssociateTransaction,
    TokenBurnTransaction, PublicKey } = require("@hashgraph/sdk");
const { initiate_connection, stop_connection, get_account_id, get_account_private_key } = require("./common-hdr-functions");
// require("dotenv").config();

/**
 * Creating a new Hedera NFT
 * @param {string} token_name - The name for the NFT
 * @param {string} token_symbol - The symbol for the NFT
 * @returns {Object} newNFT - A JSON representation of the newly created NFT.
 */
async function create_nft(token_name, token_symbol) {
    try {
        const client = await initiate_connection();
        const max_supply = 250;  //max vote is 250
        const account_private_key = PrivateKey.fromStringECDSA(get_account_private_key());
        const account_id = AccountId.fromString(get_account_id());  //use ECDSA string rather than just string, But the method name remain the same. fromStringECDSA() does not work.

        // Create the token
        let tokenCreateTx = await new TokenCreateTransaction()
            // NOTE: Configure HTS token to be created
            .setTokenName(token_name)
            .setTokenSymbol(token_symbol)
            .setTokenMemo('This will be my vote on the Lyric - xxxx')
            .setTokenType(TokenType.NonFungibleUnique)
            .setDecimals(0)
            .setInitialSupply(0)
            .setTreasuryAccountId(account_id)
            .setSupplyType(TokenSupplyType.Finite)
            .setMaxSupply(max_supply)
            .setSupplyKey(account_private_key)
            .setAdminKey(account_private_key)
            .freezeWith(client);

        const tokenCreateTxSigned = await tokenCreateTx.sign(account_private_key);
        const tokenCreateTxSubmitted = await tokenCreateTxSigned.execute(client);
        const tokenCreateTxReceipt = await tokenCreateTxSubmitted.getReceipt(client);
        const token_id = tokenCreateTxReceipt.tokenId;

        const tokenExplorerUrl = `https://hashscan.io/testnet/token/${token_id}`;

        console.log('Successfully created a new NFT: ');
        console.log("The new Token ID is: ", token_id);

        // Query token balance of account (mirror node)
        // need to wait 3 seconds for the record files to be ingested by the mirror nodes
        await new Promise((resolve) => setTimeout(resolve, 3000));
        // NOTE: Mirror Node API to query specified token balance
        const accountBalanceFetchApiUrl =
            `https://testnet.mirrornode.hedera.com/api/v1/accounts/${account_id}/tokens?token.id=${token_id}&limit=1&order=desc`;
        const accountBalanceFetch = await fetch(accountBalanceFetchApiUrl);
        const accountBalanceJson = await accountBalanceFetch.json();
        const accountBalanceToken = accountBalanceJson?.tokens[0]?.balance;

        // output results
        console.log(`accountId: ${account_id}`);
        console.log(`tokenId: ${token_id}`);
        console.log(`tokenExplorerUrl: ${tokenExplorerUrl}`);
        console.log(`accountTokenBalance: ${accountBalanceToken}`);
        console.log(`accountBalanceFetchApiUrl: ${accountBalanceFetchApiUrl}`);

        const newNFT = {
            treasury_account_id: account_id.toString(),
            nft_id: token_id.toString(),
            tokenExplorerUrl: tokenExplorerUrl,
            accountTokenBalance: accountBalanceToken,
            accountBalanceFetchApiUrl: accountBalanceFetchApiUrl
        }

        stop_connection(client);

        return newNFT;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

/**
 * Minting a new Hedera NFT
 * @param {string} token_id - The id of the NFT 
  * @param {string} payload - The payload to be used in a NFT token
* @returns {Object} newNftToken - A JSON representation of the newly minted NFT token.
 */
async function mint_nft(token_id, payload) {
    try {
        const client = await initiate_connection();
        const account_private_key = PrivateKey.fromStringECDSA(get_account_private_key());
        // CID = [payload.toString()]; //TODO convert into ipfs. see: https://docs.hedera.com/hedera/tutorials/token/create-and-transfer-your-first-nft#javascript

        const mintTx = await new TokenMintTransaction()
            .setTokenId(token_id)
            //.setMetadata([Buffer.from(CID)]) // set does not work with CID Text String
            // .addMetadata(Buffer.from("ipfs://myvote_value")) //works
            // .addMetadata(Buffer.from("ray_value_8"))  //works. But, only the last param works.
            .addMetadata(Buffer.from(payload))  //works
            .freezeWith(client);

        const mintTxSign = await mintTx.sign(account_private_key);
        const mintTxSubmit = await mintTxSign.execute(client);
        const mintRx = await mintTxSubmit.getReceipt(client);

        const newMintNftToken = {
            token_id: token_id,
            serial_number: mintRx.serials.toString()
        }

        const nftid = token_id + "@" + newMintNftToken.serial_number;
        const nftInfos = await new TokenNftInfoQuery()
            .setNftId(nftid)
            .execute(client);


        console.log("Created a new NFT " + newMintNftToken.token_id + " with serial number: " + newMintNftToken.serial_number);
        console.log('NFT info: ' + nftInfos.toString());

        stop_connection(client);
        return newMintNftToken;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

/**
* Burning an existing Hedera NFT, Must be already associated with the target account first
* @param {string} token_id - The id of the NFT 
* @param {string} serial_number - The serial_number of the NFT token to be burned, which will be internally converted to a List.
* @returns {string} transactionStatus - The transaction result from burning a NFT token.
*/
async function burn_nft_serial(token_id, serial_number) {
    try {
        const client = await initiate_connection();
        const account_private_key = PrivateKey.fromStringECDSA(get_account_private_key());
        const serialNumberToBurn = [serial_number]; // must be put into an array

        const burnTx = await new TokenBurnTransaction()
            .setTokenId(token_id)
            .setSerials(serialNumberToBurn)
            .freezeWith(client);

        const burnTxSign = await burnTx.sign(account_private_key);
        const burnTxResposne = await burnTxSign.execute(client);
        const receipt = await burnTxResposne.getReceipt(client);
        const transactionStatus = receipt.status.toString();

        console.log("Burned an existing NFT " + token_id + " with serial number: " + serial_number + ', status: ' + transactionStatus);

        stop_connection(client);
        return transactionStatus;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

// TODO Burn Token, takes a new owner:id

/**
* Transfering an existing Hedera NFT token to another account
* @param {string} token_id - The id of the NFT 
* @param {string} serial_number - The serial_number of the NFT token to be burned, which will be internally converted to a List.
* @param {string} recipient_id - The new receiver of the NFT token
* @returns {string} transactionStatus - The transaction result from burning a NFT token.
*/
async function transfer_nft_token(token_id, serial_number, recipient_id) {
    try {
        const client = await initiate_connection();
        const account_private_key = PrivateKey.fromStringECDSA(get_account_private_key());
        const account_id = AccountId.fromString(get_account_id());

        const transferTx = await new TransferTransaction()
            .addNftTransfer(token_id, serial_number, account_id, recipient_id)
            .freezeWith(client);

        const transferTxSign = await transferTx.sign(account_private_key);
        const transferTxSubmit = await transferTxSign.execute(client);
        const transferReceipt = await transferTxSubmit.getReceipt(client);
        const transferStatus = transferReceipt.status.toString();

        console.log(`${transferStatus} - Transferred NFT with Serial Number: ${serial_number} to ${recipient_id}`);

        return transferStatus;
    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

/**
* Associate an existing NFT to another account
* @param {string} token_id - The id of the NFT 
* @param {string} associate_account_id - The account id to be associated with this NFT
* @param {string} associate_private_key - The private key of the account to be associated with this NFT
* @returns {string} associateStatus - The transaction status of associating a NFT token to another account.
*/
async function associate_nft_token(token_id, associate_account_id, associate_private_key) {
    try {
        const client = await initiate_connection();
        const recipient_private_key = PrivateKey.fromStringECDSA(associate_private_key);        
        const associateTransaction = await new TokenAssociateTransaction()
            .setAccountId(associate_account_id)
            .setTokenIds([token_id])
            .freezeWith(client);
 
        // Sign with the private key of the recipient account
        const signAssociateTx = await associateTransaction.sign(recipient_private_key);
        const associateTxSubmit = await signAssociateTx.execute(client);
        const associateReceipt = await associateTxSubmit.getReceipt(client);
        const associateStatus = associateReceipt.status.toString();

        console.log(`${associateStatus} - Associated token ${token_id} with account ${associate_account_id}`);
        return associateStatus;

    } catch (error) {
        throw new Error('Error: ' + error);
    }
}

// TODO Get Token Details


module.exports = {
    create_nft,
    mint_nft,
    burn_nft_serial,
    transfer_nft_token, 
    associate_nft_token
}