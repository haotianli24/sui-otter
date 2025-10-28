#!/bin/bash

# Deploy Username Registry Contract
echo "Deploying Username Registry contract..."

# Navigate to the contract directory
cd move/username_registry

# Deploy the contract
sui client publish --gas-budget 100000000

echo "Contract deployment completed!"
echo "Please update the USERNAME_REGISTRY_PACKAGE_ID and USERNAME_REGISTRY_ID in the frontend code."
