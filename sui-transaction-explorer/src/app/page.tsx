import { Suspense } from 'react';
import TransactionExplorer from '@/components/TransactionExplorer'

export default function Home() {
    return (
        <main className="min-h-screen bg-gray-50">
            <Suspense fallback={<div>Loading...</div>}>
                <TransactionExplorer />
            </Suspense>
        </main>
    )
}
