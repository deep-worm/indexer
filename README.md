# Deep Worm Data Indexer

This service indexes transaction data for the Deep Worm project - an immortal on-chain worm living on Solana.

## Overview

The indexer serves as a high-performance data orchestration layer, connecting to MongoDB and continuously polling the Solscan API to fetch and store transaction data related to the Deep Worm token. By maintaining an optimized database of pre-processed on-chain events, it eliminates the need for resource-intensive block scanning at runtime, enabling lightning-fast web application performance. The system tracks token transfers, swaps and other on-chain activities with minimal latency.

## Features

- Fetches transaction data from Solscan API every minute
- Stores transaction details including:
  - Transaction signature
  - From/to addresses 
  - Amount transferred
  - Block time and slot
  - Activity type
- Maintains transaction history in MongoDB
- Handles pagination and only indexes new transactions
- Prevents duplicate processing with concurrency control