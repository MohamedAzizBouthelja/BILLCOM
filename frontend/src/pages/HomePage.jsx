import Hero from "../components/sections/Hero.jsx"
import FeatureStrip from "../components/sections/FeatureStrip.jsx"
import CategoryGrid from "../components/sections/CategoryGrid.jsx"
import FeaturedProducts from "../components/sections/FeaturedProducts.jsx"
import RecommendedForYou from "../components/sections/RecommendedForYou.jsx"
import DealOfDay from "../components/sections/DealOfDay.jsx"
import NewArrivals from "../components/sections/NewArrivals.jsx"
import Testimonials from "../components/sections/Testimonials.jsx"
import Newsletter from "../components/sections/Newsletter.jsx"

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeatureStrip />
      <CategoryGrid />
      <FeaturedProducts />
      <RecommendedForYou />
      <DealOfDay />
      <NewArrivals />
      <Testimonials />
      <Newsletter />
    </>
  )
}
