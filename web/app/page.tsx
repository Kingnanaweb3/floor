import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import How from "@/components/How";
import Why from "@/components/Why";
import Proof from "@/components/Proof";
import Faq from "@/components/Faq";
import Closing from "@/components/Closing";
import Reveal from "@/components/Reveal";

export default function Page() {
  return (
    <main>
      <Reveal />
      <Nav />
      <Hero />
      <How />
      <Why />
      <Proof />
      <Faq />
      <Closing />
    </main>
  );
}
