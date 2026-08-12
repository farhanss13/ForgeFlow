import * as React from "react";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ProductPreview } from "@/components/landing/preview";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="grow">
        <Hero />
        <Features />
        <ProductPreview />
      </main>
      <Footer />
    </div>
  );
}
