const express = require('express');
const js2xmlparser = require('js2xmlparser');
const { create_account } = require('./hdr-create-account');
const { create_nft, mint_nft, burn_nft_serial, transfer_nft_token, associate_nft_token } = require('./hdr-nft');
require("dotenv").config();

const app = express();
const port = process.env.PORT_NUMBER; // port number is from the .env file

function log_error(error, res, req) {
  console.log(`${error.message}, when calling: ${req.originalUrl}, with JSON payload: ${req.body}`);
  res.send(`${error.message}`);
}

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));

// call create a new Hedera account
async function call_create_account() {
  const res = await create_account();
  return res;
}

// Route for create a new Hedera account, using Post
app.post('/create_account', async (req, res) => {
  try {
    const result = await call_create_account();
    //html
    if (req.accepts('text/html')) {
      res.send("The created account is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    res.send(`Exception has occured: ${error.message}`);
  }

});

// call create a new Hedera NFT
// nft_name and nft_symbol are retrieved from url as in: http://localhost:3000/create_nft?nft_name=test_nft&nft_symbol=tstnft
async function call_create_nft(nft_name, nft_symbol) {
  const res = await create_nft(nft_name, nft_symbol);
  return res;
}

// Route for create a new NFT, using Post and JSON body
app.post('/create_nft', async (req, res) => {
  try {
    const nft_name = req.body.nft_name;
    const nft_symbol = req.body.nft_symbol;
    const result = await call_create_nft(nft_name, nft_symbol);
    //html
    if (req.accepts('text/html')) {
      res.send("The created NFT is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    log_error(error, res, req);
  }
});

// call mint a new Hedera NFT with a given token_id and payload
// nft_name and nft_symbol are retrieved from url as in: http://localhost:3000/mint_nft?token_id=0.0.4665522&payload=MySecondVote
async function call_mint_nft(token_id, metadata) {
  const res = await mint_nft(token_id, metadata);
  return res;
}

// Route for minting a new NFT, using POST and a JSON body, TODO ... on payload part.
app.post('/mint_nft', async (req, res) => {
  try {
    const token_id = req.body.token_id;
    const metadata = req.body.metadata;
    const result = await call_mint_nft(token_id, metadata);
    //html
    if (req.accepts('text/html')) {
      res.send("The minted NFT is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    log_error(error, res, req);
  }
});

// call burn an existing Hedera NFT with a given token_id and serial_number
// See the url as in: http://localhost:3000/burn_nft_serial?token_id=0.0.4665522&serial_number=3
async function call_burn_nft(token_id, serial_number) {
  const res = await burn_nft_serial(token_id, serial_number);
  return res;
}

// Route for burning an existing NFT, indicated by a token_id and serial_number, using Delete and JSON body
app.delete('/burn_nft_serial', async (req, res) => {
  try {
    const token_id = req.body.token_id;
    const serial_number = req.body.serial_number;
    const result = await call_burn_nft(token_id, serial_number);
    //html
    if (req.accepts('text/html')) {
      res.send("The burned NFT token is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    log_error(error, res, req);
  }
});

// call tansfer an existing Hedera NFT to another account, must be already associated.
// See the url as in: http://localhost:3000/transfer_nft_token?token_id=0.0.4672167&serial_number=3&recipient_id=0.0.4662027
async function call_transfer_nft_token(token_id, serial_number, recipient_id) {
  const res = await transfer_nft_token(token_id, serial_number, recipient_id);
  return res;
}

// Route for transfer an existing NFT to another account, must be already associated. using PUT and JSON body
app.put('/transfer_nft_token', async (req, res) => {
  try {
    const token_id = req.body.token_id;
    const serial_number = req.body.serial_number;
    const recipient_id = req.body.recipient_id;
    const result = await call_transfer_nft_token(token_id, serial_number, recipient_id);
    //html
    if (req.accepts('text/html')) {
      res.send("The transfered NFT token is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    log_error(error, res, req);
  }
});


// call associating an existing Hedera NFT to another account
// See the url as in: 
async function call_associate_nft_to_account(token_id, associate_account_id, associate_private_key) {
  const res = await associate_nft_token(token_id, associate_account_id, associate_private_key);
  return res;
}

// Route for associating an existing NFT to another account, using PUT method and JSON body
app.put('/associate_nft_to_account', async (req, res) => {
  try {
    const token_id = req.body.token_id;
    const associate_account_id = req.body.associate_account_id;
    const associate_private_key = req.body.associate_private_key;

    const result = await call_associate_nft_to_account(token_id, associate_account_id, associate_private_key);
    //html
    if (req.accepts('text/html')) {
      res.send("The status of associating NFt to account is: " + JSON.stringify(result));
    }
    //json
    else if (req.accepts('application/json')) {
      res.set('content-type', 'application/json');
      res.json(result);
    }
    //exception
    else {
      // If not HTML, JSON or XML, then send 406 error
      res.status(406).send('not acceptable content format requested');
    }
  } catch (error) {
    log_error(error, res, req);
  }
});

// default home page of the app.
app.get('/', async (req, res) => {
  const now = new Date();
  const currentTime = now.toString();
  res.send(`Hello, you have reached the front page for the hedera svr. The current time is: ${currentTime}`);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});