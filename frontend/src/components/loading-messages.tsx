"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function LoadingMessages({ messages }: { messages: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <Loader2 className="size-4 shrink-0 animate-spin" />
      <motion.span
        key={index}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {messages[index % messages.length]}
      </motion.span>
    </div>
  );
}
