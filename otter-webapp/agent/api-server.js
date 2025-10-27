#!/usr/bin/env node

/**
 * Simple API server to sync followed traders from webapp to agent
 * Allows the webapp to automatically update followed_traders.json
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3002;
const FOLLOWERS_FILE = path.join(__dirname, 'followed_traders.json');
const HISTORY_FILE = path.join(__dirname, 'trade_history.json');

// Enable CORS for webapp
app.use(cors({
    origin: ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Agent API server running' });
});

// Get current followed traders
app.get('/api/followed-traders', async (req, res) => {
    try {
        const data = await fs.readFile(FOLLOWERS_FILE, 'utf8');
        const json = JSON.parse(data);
        res.json(json);
    } catch (error) {
        console.error('Error reading followed traders:', error);
        res.status(500).json({ 
            error: 'Failed to read followed traders',
            followedTraders: []
        });
    }
});

// Get trade history
app.get('/api/trade-history', async (req, res) => {
    try {
        const data = await fs.readFile(HISTORY_FILE, 'utf8');
        const json = JSON.parse(data);
        res.json(json);
    } catch (error) {
        // No history yet is okay
        res.json({ 
            trades: [],
            lastUpdated: new Date().toISOString(),
            totalTrades: 0
        });
    }
});

// Update followed traders
app.post('/api/followed-traders', async (req, res) => {
    try {
        const { followedTraders } = req.body;
        
        if (!Array.isArray(followedTraders)) {
            return res.status(400).json({ error: 'followedTraders must be an array' });
        }
        
        // Validate addresses
        for (const address of followedTraders) {
            if (typeof address !== 'string' || !address.startsWith('0x') || address.length !== 66) {
                return res.status(400).json({ 
                    error: `Invalid address format: ${address}` 
                });
            }
        }
        
        const data = {
            followedTraders,
            timestamp: new Date().toISOString(),
            source: 'webapp-auto-sync'
        };
        
        await fs.writeFile(FOLLOWERS_FILE, JSON.stringify(data, null, 2));
        
        console.log(`✅ Updated followed traders: ${followedTraders.length} addresses`);
        followedTraders.forEach(addr => {
            console.log(`   📊 ${addr.slice(0, 16)}...`);
        });
        
        res.json({ 
            success: true, 
            message: `Updated ${followedTraders.length} followed traders`,
            data 
        });
    } catch (error) {
        console.error('Error updating followed traders:', error);
        res.status(500).json({ error: 'Failed to update followed traders' });
    }
});

// Add a single trader
app.post('/api/followed-traders/add', async (req, res) => {
    try {
        const { address } = req.body;
        
        if (!address || !address.startsWith('0x') || address.length !== 66) {
            return res.status(400).json({ error: 'Invalid address format' });
        }
        
        // Read current followers
        let current = { followedTraders: [] };
        try {
            const data = await fs.readFile(FOLLOWERS_FILE, 'utf8');
            current = JSON.parse(data);
        } catch (error) {
            // File doesn't exist or is invalid, start fresh
        }
        
        // Add if not already present
        if (!current.followedTraders.includes(address)) {
            current.followedTraders.push(address);
            
            const data = {
                followedTraders: current.followedTraders,
                timestamp: new Date().toISOString(),
                source: 'webapp-auto-sync'
            };
            
            await fs.writeFile(FOLLOWERS_FILE, JSON.stringify(data, null, 2));
            
            console.log(`✅ Added trader: ${address.slice(0, 16)}...`);
            
            res.json({ 
                success: true, 
                message: 'Trader added',
                followedTraders: data.followedTraders
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Trader already followed',
                followedTraders: current.followedTraders
            });
        }
    } catch (error) {
        console.error('Error adding trader:', error);
        res.status(500).json({ error: 'Failed to add trader' });
    }
});

// Remove a trader
app.post('/api/followed-traders/remove', async (req, res) => {
    try {
        const { address } = req.body;
        
        // Read current followers
        let current = { followedTraders: [] };
        try {
            const data = await fs.readFile(FOLLOWERS_FILE, 'utf8');
            current = JSON.parse(data);
        } catch (error) {
            return res.status(404).json({ error: 'No followed traders found' });
        }
        
        // Remove if present
        const index = current.followedTraders.indexOf(address);
        if (index > -1) {
            current.followedTraders.splice(index, 1);
            
            const data = {
                followedTraders: current.followedTraders,
                timestamp: new Date().toISOString(),
                source: 'webapp-auto-sync'
            };
            
            await fs.writeFile(FOLLOWERS_FILE, JSON.stringify(data, null, 2));
            
            console.log(`✅ Removed trader: ${address.slice(0, 16)}...`);
            
            res.json({ 
                success: true, 
                message: 'Trader removed',
                followedTraders: data.followedTraders
            });
        } else {
            res.json({ 
                success: true, 
                message: 'Trader was not followed',
                followedTraders: current.followedTraders
            });
        }
    } catch (error) {
        console.error('Error removing trader:', error);
        res.status(500).json({ error: 'Failed to remove trader' });
    }
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 AGENT API SERVER RUNNING');
    console.log('='.repeat(60));
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`📁 Syncing to: ${FOLLOWERS_FILE}`);
    console.log(`🌐 CORS enabled for: http://localhost:3001`);
    console.log('\nEndpoints:');
    console.log(`  GET  /api/followed-traders        - Get current followed traders`);
    console.log(`  GET  /api/trade-history           - Get trade copy history`);
    console.log(`  POST /api/followed-traders        - Update all followed traders`);
    console.log(`  POST /api/followed-traders/add    - Add a trader`);
    console.log(`  POST /api/followed-traders/remove - Remove a trader`);
    console.log('\n' + '='.repeat(60) + '\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down API server...');
    process.exit(0);
});

