import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Hero />
      <Features />
      <Footer />
    </div>
  );
};

export default Index;
