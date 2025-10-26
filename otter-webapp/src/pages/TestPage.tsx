import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ImageTest } from '../components/ImageTest';

export function TestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testNetworkConnection = async () => {
    addResult('Testing mainnet connection...');
    try {
      const response = await fetch('https://fullnode.mainnet.sui.io:443', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getChainIdentifier',
          params: []
        })
      });
      
      const data = await response.json();
      if (data.result) {
        addResult(`✅ Mainnet connected! Chain ID: ${data.result}`);
      } else {
        addResult(`❌ Mainnet connection failed: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      addResult(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testWalrusConnection = async () => {
    addResult('Testing Walrus mainnet connection...');
    try {
      // Test publisher
      const publisherResponse = await fetch('https://publisher.walrus-mainnet.walrus.space/v1/health', {
        method: 'HEAD'
      });
      
      if (publisherResponse.ok) {
        addResult('✅ Walrus publisher accessible');
      } else {
        addResult(`⚠️ Walrus publisher returned ${publisherResponse.status}`);
      }

      // Test aggregator
      const aggregatorResponse = await fetch('https://aggregator.mainnet.walrus.mirai.cloud/v1/health', {
        method: 'HEAD'
      });
      
      if (aggregatorResponse.ok) {
        addResult('✅ Walrus aggregator accessible');
      } else {
        addResult(`⚠️ Walrus aggregator returned ${aggregatorResponse.status}`);
      }
    } catch (error) {
      addResult(`❌ Walrus connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testGraphQLConnection = async () => {
    addResult('Testing GraphQL mainnet connection...');
    try {
      const response = await fetch('https://graphql.mainnet.sui.io/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: '{ __schema { types { name } } }'
        })
      });
      
      const data = await response.json();
      if (data.data) {
        addResult('✅ GraphQL mainnet connected!');
      } else {
        addResult(`❌ GraphQL connection failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
      }
    } catch (error) {
      addResult(`❌ GraphQL error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting mainnet connectivity tests...');
    
    await testNetworkConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testWalrusConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testGraphQLConnection();
    
    addResult('✅ All tests completed!');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mainnet Connectivity Test</CardTitle>
          <CardDescription>
            Test all mainnet connections without actually using real mainnet resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runAllTests}>Run All Tests</Button>
            <Button onClick={testNetworkConnection} variant="outline">Test Sui Network</Button>
            <Button onClick={testWalrusConnection} variant="outline">Test Walrus</Button>
            <Button onClick={testGraphQLConnection} variant="outline">Test GraphQL</Button>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h4 className="font-semibold mb-2">Test Results:</h4>
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ImageTest />
    </div>
  );
}
