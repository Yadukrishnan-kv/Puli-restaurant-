import { HeroBanner } from "../components/HeroBanner";
import { StorySection } from "../components/StorySection";
import { CategoryGrid } from "../components/CategoryGrid";
import { Footer } from "../components/Footer";

export const HomePage: React.FC = () => {
  return (
    <main className="layout">
      <div className="layout__content">
        <HeroBanner />
        <StorySection />
        <CategoryGrid />
      </div>
      <Footer />
    </main>
  );
};

