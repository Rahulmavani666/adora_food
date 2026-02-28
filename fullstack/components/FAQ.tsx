// components/FAQ.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const faqs = [
  {
    question: "What is this platform about?",
    answer:
      "We connect food donors with NGOs in real-time, reducing food waste and fighting hunger."
  },
  {
    question: "How can I donate food?",
    answer:
      "Simply sign up, list your surplus food, and our partnered NGOs will coordinate pickup."
  },
  {
    question: "Is it free to use?",
    answer:
      "Yes, our service is completely free for both donors and NGOs."
  },
  {
    question: "How quickly is food picked up?",
    answer:
      "Pickups are typically arranged within 2 hours of your donation listing."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section className=" bg-black text-white bg-gradient-to-b from-[#9450a3]  to-black py-16 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-gray-200 mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-gray-200 mb-12">
          Quick answers to the most common questions about our platform.
        </p>

        <div className="space-y-4 text-left">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white/75 rounded-xl shadow-md p-4 cursor-pointer border border-gray-200 hover:shadow-lg transition-all duration-300"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-800">
                  {faq.question}
                </h3>
                <span className="text-gray-500 text-2xl">
                  {activeIndex === index ? "−" : "+"}
                </span>
              </div>

              <AnimatePresence>
                {activeIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-2 text-gray-600"
                  >
                    {faq.answer}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
