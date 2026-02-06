import React from 'react';
import { Shield, Zap, Clock, HeadphonesIcon, CreditCard, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function WhyChooseUs() {
  const features = [
    {
      icon: Zap,
      title: "Instant Processing",
      description: "Most services are processed automatically within minutes"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Your data is protected with enterprise-grade security"
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description: "Access our services anytime, anywhere in the world"
    },
    {
      icon: HeadphonesIcon,
      title: "Expert Support",
      description: "Professional technical support team ready to help"
    },
    {
      icon: CreditCard,
      title: "Multiple Payment Options",
      description: "Credit cards, crypto, and various payment methods"
    },
    {
      icon: RefreshCw,
      title: "Money-Back Guarantee",
      description: "Full refund if we can't complete your service"
    }
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-950/20 via-transparent to-cyan-950/20" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Why Choose <span className="text-cyan-400">Tsmart GSM</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Trusted by thousands of professionals worldwide for reliable GSM services
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center group"
            >
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}