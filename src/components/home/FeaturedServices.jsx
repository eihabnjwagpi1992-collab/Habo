import React from 'react';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, Star, Clock, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import GlowCard from "@/components/ui/GlowCard";

export default function FeaturedServices({ services = [] }) {
  const displayServices = services.slice(0, 6);

  if (displayServices.length === 0) {
    return null;
  }

  return (
    <section className="py-24 relative bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Featured <span className="text-cyan-400">Services</span>
            </h2>
            <p className="text-gray-400">Most popular services this month</p>
          </div>
          <Link to={createPageUrl("Services")}>
            <Button variant="ghost" className="text-cyan-400 hover:text-cyan-300 group">
              View All
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* ✅ تعديل هنا: id بدل serviceId */}
              <Link to={createPageUrl("OrderService") + `?id=${service.id}`}>
                <GlowCard className="p-6 h-full cursor-pointer group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-gray-400">Featured</span>
                    </div>
                    <span className="px-3 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                      {service.category?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                    {service.processing_time && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {service.processing_time}
                      </div>
                    )}
                    {service.success_rate && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        {service.success_rate}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-2xl font-bold text-white">
                      ${service.price?.toFixed(2)}
                    </div>
                    <Button size="sm" className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30">
                      Order Now
                    </Button>
                  </div>
                </GlowCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
