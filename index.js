// Load environment variables from .env file
require('dotenv').config();

// Import necessary libraries
const express = require('express');
const { ethers } = require('ethers');
const cors = require('cors');
const contractABI = require('./contract-abi.json');

// Initialize the express app
const app = express();
app.use(cors());
app.use(express.json());

// --- Blockchain Connection Setup ---
const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(API_URL);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

// --- API "Read" Endpoints ---

app.get('/batch/:id', async (req, res) => {
  try {
    const batchId = req.params.id;
    console.log(`Fetching details for batch ID: ${batchId}`);
    const batchDetails = await contract.batches(batchId);
    
    // We'll format the response to be more readable
    res.json({
        batchId: parseInt(batchDetails.batchId),
        farmer: batchDetails.farmer,
        origin: batchDetails.origin,
        produceType: batchDetails.produceType,
        harvestTimestamp: new Date(parseInt(batchDetails.harvestTimestamp) * 1000).toLocaleString(),
        currentOwner: batchDetails.currentOwner,
        currentState: parseInt(batchDetails.currentState)
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching batch details.');
  }
});

// --- API "Write" Endpoints ---

// Endpoint to register a new farmer
app.post('/register-farmer', async (req, res) => {
    try {
        const { farmerAddress } = req.body;
        console.log(`Registering farmer: ${farmerAddress}`);
        const tx = await contract.registerFarmer(farmerAddress);
        await tx.wait(); // Wait for the transaction to be mined
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error registering farmer.');
    }
});

// Endpoint to create a new batch
app.post('/batch', async (req, res) => {
    try {
        const { origin, produceType, offChainDataHash } = req.body;
        console.log('Creating a new batch...');
        const tx = await contract.createBatch(origin, produceType, offChainDataHash);
        await tx.wait(); // Wait for the transaction to be mined
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating batch.');
    }
});

// Start the server
const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});