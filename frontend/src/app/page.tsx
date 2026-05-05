"use client";

import { useRouter } from "next/navigation";
import Hero from "./components/Hero";
import Advantages from "./components/Advantages";
import CoreFeatures from "./components/CoreFeatures";
import BenchMarks from "./components/BenchMarks";
import Products from "./components/Products";
import Footer from "./components/Footer";

export default function Home() {
  const router = useRouter();

  const handleEnterDashboard = () => {
    localStorage.setItem("axiom_entered", "true");
    router.push("/dashboard");
  };

  return (
    <main className="bg-[#F4F7FC]">
      <Hero onEnter={handleEnterDashboard} />
      <Advantages />
      <CoreFeatures />
      <BenchMarks />
      <Products />
      <Footer />
    </main>
  );
}
