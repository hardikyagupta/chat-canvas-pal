import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentData {
  id: string;
  name: string;
  email: {
    subject: string;
  };
  appPush: {
    title: string;
    message: string;
    cta: string;
  };
  whatsapp: {
    header: string;
    body: string;
    footer: string;
    cta1: string;
    cta2: string;
  };
}

// Same segment data as the content agent but used for executive summary display
const segmentData: SegmentData[] = [
  {
    id: "premium-perfume",
    name: "Premium Perfume Enthusiasts",
    email: {
      subject: "VIP Access: Love's Luxury Collection"
    },
    appPush: {
      title: "Luxury Awaits 💎",
      message: "VIP Valentine's collection - exclusively for you",
      cta: "Shop VIP Collection"
    },
    whatsapp: {
      header: "💎 VIP Valentine's Collection 💎",
      body: "Exclusive access to our most luxurious fragrances. Limited edition Valentine's collection available only to our VIP members.",
      footer: "Premium experience guaranteed ✨",
      cta1: "Shop VIP Collection",
      cta2: "Browse Luxury"
    }
  },
  {
    id: "recent-browsers",
    name: "Recent Beauty Browsers",
    email: {
      subject: "First Love: Special Valentine's Offer"
    },
    appPush: {
      title: "Special Offer Inside 💕",
      message: "Your perfect Valentine's fragrance awaits",
      cta: "Claim Offer"
    },
    whatsapp: {
      header: "💕 Your Perfect Scent Awaits 💕",
      body: "We noticed you've been exploring our fragrance collection. Here's a special Valentine's offer just for you - find your signature scent today!",
      footer: "Limited time offer ends soon! ⏰",
      cta1: "Shop Now",
      cta2: "Browse Collection"
    }
  },
  {
    id: "loyal-shoppers",
    name: "Loyal Beauty Shoppers",
    email: {
      subject: "Members-Only Valentine's Bundle"
    },
    appPush: {
      title: "Members Only 🌟",
      message: "Exclusive Valentine's bundle just for you",
      cta: "View Bundle"
    },
    whatsapp: {
      header: "🌟 Members-Only Valentine's Bundle 🌟",
      body: "Thank you for being a valued customer! Enjoy exclusive access to our curated Valentine's bundle with special member pricing.",
      footer: "Your loyalty is appreciated 💖",
      cta1: "View Bundle",
      cta2: "Member Benefits"
    }
  },
  {
    id: "high-intent",
    name: "High Intent New Customers",
    email: {
      subject: "Love at First Scent: 20% Off"
    },
    appPush: {
      title: "20% Off Valentine's 💘",
      message: "Limited time - your favorites at special prices",
      cta: "Shop Now"
    },
    whatsapp: {
      header: "💘 20% Off Valentine's Collection 💘",
      body: "Ready to find your perfect Valentine's fragrance? Enjoy 20% off our entire collection - from classic romance to modern allure.",
      footer: "Offer ends February 14th! 📅",
      cta1: "Shop 20% Off",
      cta2: "View Collection"
    }
  },
  {
    id: "welcome-premium",
    name: "Welcome Premium Segment",
    email: {
      subject: "Your Perfect Valentine's Match"
    },
    appPush: {
      title: "Perfect Match Found 💖",
      message: "Personalized Valentine's recommendations ready",
      cta: "See Matches"
    },
    whatsapp: {
      header: "💖 Your Perfect Valentine's Match 💖",
      body: "Welcome to our premium fragrance family! Based on your preferences, we've curated personalized Valentine's recommendations just for you.",
      footer: "Discover your signature scent journey 🌹",
      cta1: "See My Matches",
      cta2: "Take Quiz"
    }
  }
];

export function ExecutiveSummaryContentAccordion() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full mt-4 pt-4 border-t border-gray-200">
      <div className="space-y-3">
        {/* Single Accordion Trigger - "View content" */}
        <button
          onClick={toggleAccordion}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={cn(
            // Auto layout: flex, flex-direction: row, align-items: center
            "flex flex-row items-center",
            // Padding: 5px, gap: 2px
            "px-[5px] py-[5px] gap-[2px]",
            // Width: auto (flexible for text), height: 26px
            "h-[26px] w-auto",
            // Border radius: 5px
            "rounded-[5px]",
            // Transition for smooth hover
            "transition-all duration-200",
            // Background based on state - exactly matching Figma
            isHovered ? "bg-[#F3F4F6]" : "bg-white",
            // Focus styles
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          )}
        >
          {/* Chevron Icon - 16x16px */}
          <div className="w-4 h-4 flex items-center justify-center flex-none">
            {isOpen ? (
              <ChevronDown 
                className={cn(
                  "w-4 h-4 transition-all duration-200",
                  // Color based on hover state
                  isHovered ? "text-[#394150]" : "text-[#6C717F]"
                )} 
              />
            ) : (
              <ChevronRight 
                className={cn(
                  "w-4 h-4 transition-all duration-200",
                  // Color based on hover state  
                  isHovered ? "text-[#394150]" : "text-[#6C717F]"
                )} 
              />
            )}
          </div>
          
          {/* "View content" Text - Nunito Sans, 500 weight, 12px, 16px line height */}
          <span 
            className={cn(
              // Font specifications from Figma
              "font-['Nunito Sans'] font-medium text-xs leading-4",
              // Height: 16px, flex: none, order: 1, flex-grow: 0
              "h-4 flex-none",
              // Color based on hover state
              isHovered ? "text-[#394150]" : "text-[#6C717F]",
              "transition-colors duration-200"
            )}
          >
            View content
          </span>
        </button>

        {/* Accordion Content - Shows ALL segments when opened */}
        {isOpen && (
          <div className="ml-6 space-y-6 transition-all duration-300 ease-in-out">
            {segmentData.map((segment, index) => (
              <div key={segment.id} className="space-y-3 pb-4 border-b border-gray-100 last:border-b-0">
                {/* Segment Title */}
                <h3 className="font-semibold text-sm text-gray-900 mb-3">
                  {segment.name}
                </h3>

                {/* Email Section */}
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-800">Email</h4>
                  <p className="text-sm text-gray-700"><span className="font-medium">Subject:</span> {segment.email.subject}</p>
                </div>

                {/* App Push Section */}
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-800">App Push</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Title:</span> {segment.appPush.title}</p>
                    <p><span className="font-medium">Message:</span> {segment.appPush.message}</p>
                    <p><span className="font-medium">CTA:</span> {segment.appPush.cta}</p>
                  </div>
                </div>

                {/* WhatsApp Section */}
                <div>
                  <h4 className="font-semibold text-sm mb-1 text-gray-800">WhatsApp</h4>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><span className="font-medium">Header:</span> {segment.whatsapp.header}</p>
                    <p><span className="font-medium">Body:</span> {segment.whatsapp.body}</p>
                    <p><span className="font-medium">Footer:</span> {segment.whatsapp.footer}</p>
                    <p><span className="font-medium">CTA 1:</span> {segment.whatsapp.cta1}</p>
                    <p><span className="font-medium">CTA 2:</span> {segment.whatsapp.cta2}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 