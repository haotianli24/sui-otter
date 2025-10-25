import MatrixBackground from './components/MatrixBackground';
import Hero from './components/Hero';

export default function Home() {
  return (
    <main className="relative bg-background overflow-hidden">
      {/* Cyber background covering entire page */}
      <div className="fixed inset-0 w-full h-full z-0">
        <MatrixBackground opacity={0.4} />
      </div>
      
      {/* Hero section on top of background */}
      <div className="relative min-h-screen z-10">
        <Hero />
      </div>
    </main>
  );
}
