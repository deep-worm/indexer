import mongoose from 'mongoose';
import Transaction from './Transaction';
import axios from 'axios';
import { CronJob } from 'cron';
import dotenv from 'dotenv';

dotenv.config();

async function getLatestBlockTimestamp() {
    const latestTransaction = await Transaction.findOne().sort({ blockTime: -1 }).exec();
    return latestTransaction ? latestTransaction.blockTime : 0;
}

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB successfully');
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
}

// Connect to MongoDB
connectToMongoDB();

let isRunning = false;
async function fetchTransactions() {
    if (isRunning) {
        console.log('Fetching transactions is already running');
        return;
    }

    isRunning = true;

    const latestBlockTime = await getLatestBlockTimestamp() || 0;

    const requestOptions: any = {
        headers: {
            'token': process.env.SOLSCAN_API_KEY,
        },
        params: {
            page_size: 100,
            address: process.env.TOKEN_MINT_ADDRESS
        },
    };

    let page = 1;
    let hasMoreData = true;

    try {
        while (hasMoreData) {
            requestOptions.params.page = page;

            const response = await axios.get(
                'https://pro-api.solscan.io/v2.0/token/defi/activities',
                requestOptions
            );
            const data = response.data;
            if (data.success && data.data.length > 0) {
                const transactions = data.data.map((activity: any) => ({
                    signature: activity.trans_id,
                    from: activity.from_address,
                    to: activity.to_address,
                    amount: activity.routers.amount1.toString(),
                    slot: activity.block_id,
                    blockTime: activity.block_time,
                    activity_type: activity.activity_type,
                }));

                // Check if any transaction is older than the latest block time in the DB
                const newTransactions = transactions.filter((tx: any) => tx.blockTime > latestBlockTime);

                if (newTransactions.length === 0) {
                    console.log('No new transactions found');
                    hasMoreData = false;
                    break;
                }

                // Prepare bulk operations
                const bulkOps = newTransactions.map((tx: any) => ({
                    updateOne: {
                        filter: { signature: tx.signature },
                        update: { $set: tx },
                        upsert: true,
                    },
                }));

                // Execute bulk operations
                await Transaction.bulkWrite(bulkOps);
                console.log(`Page ${page}: ${newTransactions.length} transactions processed successfully`);

                page += 1;
            } else {
                hasMoreData = false;
            }
        }
    } catch (err: any) {
        console.error('Error fetching transactions:', err.response?.data || err.message);
    }

    isRunning = false;
}


// Schedule fetchTransactions to run every minute
const job = new CronJob('*/1 * * * *', fetchTransactions, null, true);

job.start();

// Fetch transactions on startup
fetchTransactions();