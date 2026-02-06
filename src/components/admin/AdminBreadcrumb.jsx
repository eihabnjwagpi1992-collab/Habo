import React from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminBreadcrumb({ title, backTo }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center mb-6"
    >
      {backTo && (
        <Link
          to={backTo}
          className="flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors mr-3"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          <span>رجوع</span>
        </Link>
      )}

      <h1 className="text-2xl font-bold text-white">{title}</h1>
    </motion.div>
  );
}
