'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  const handleLearnMore = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleEnterApp = () => {
    // Navigate to dashboard
    router.push('/dashboard');
  };

  return (
    <section className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-8 z-20">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="font-playfair font-semibold text-6xl sm:text-7xl text-foreground mb-6"
        >
          Project Otter
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8"
        >
          Transparency. Trust. Together. A decentralized social trading platform built on Sui, 
          where communities share and track on-chain trades in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            onClick={handleEnterApp}
            className="group px-8 py-6 text-base rounded-2xl"
          >
            Enter App
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={handleLearnMore}
            className="px-8 py-6 text-base rounded-2xl border-muted-foreground text-muted-foreground hover:border-primary hover:text-primary"
          >
            Learn More
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
