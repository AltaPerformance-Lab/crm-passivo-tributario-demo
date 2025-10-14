"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface CollapsibleCardProps {
  title: React.ReactNode;
  children: React.ReactNode;
}

export default function CollapsibleCard({
  title,
  children,
}: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-800 shadow-md rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left"
      >
        <h2 className="text-2xl font-bold">{title}</h2>
        <ChevronDown
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
