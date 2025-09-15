import React, { useState, useEffect } from "react";
import { EngagementScore } from "@/components/EngagementScore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Mail, BellRing, MessageSquare, Search, Check, ChevronDown, X } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { WhatsAppTextBased } from "./WhatsAppTextBased";
import { WhatsAppCarouselBased } from "./WhatsAppCarouselBased";
import { WhatsAppMediaBased } from "./WhatsAppMediaBased";


interface ContentAgentResponseProps {
  emailContent?: React.ReactNode;
  apnContent?: React.ReactNode;
  whatsappContent?: React.ReactNode;
  isPlanMode?: boolean; // New prop to determine mode
  onContentChanged?: (hasChanges: boolean) => void; // Callback when content changes
  onUpdateContent?: (updatedContent: any) => void; // Callback for update action
  onDiscardChanges?: () => void; // Callback for discard action
  updateHandlers?: {
    handleUpdate: () => void;
    handleDiscard: () => void;
  };
  updatedContent?: any; // New prop to pass updated content
}

// Mock data for template thumbnails and existing templates
const templateThumbnails = [
  { 
    id: "template1", 
    name: "Valentine Special", 
    templateId: "t-1003",
    thumbnail: "/lovable-uploads/template1.jpg",
    previewBg: "from-rose-50 to-rose-100",
    previewText: "♥️ Valentine's Day",
    previewIcon: "💌",
    engagementScore: 85
  },
  { 
    id: "template2", 
    name: "Discount Offer", 
    templateId: "t-4567",
    thumbnail: "/lovable-uploads/template2.jpg",
    previewBg: "from-amber-50 to-amber-100",
    previewText: "50% OFF",
    previewIcon: "🏷️",
    engagementScore: 92
  },
  { 
    id: "template3", 
    name: "Product Launch", 
    templateId: "t-8901",
    thumbnail: "/lovable-uploads/template3.jpg",
    previewBg: "from-blue-50 to-blue-100",
    previewText: "New Arrival",
    previewIcon: "🚀",
    engagementScore: 79
  },
];

const existingTemplates = [
  { id: "t-1001", name: "Winter Sale Template", engagementScore: 78 },
  { id: "t-1002", name: "New Year Special", engagementScore: 82 },
  { id: "t-1003", name: "Valentine's Day Promotion", engagementScore: 85 },
  { id: "t-1004", name: "Spring Collection Announcement", engagementScore: 73 },
  { id: "t-1005", name: "Summer Flash Sale", engagementScore: 91 },
  { id: "t-1006", name: "Back to School Campaign", engagementScore: 67 },
  { id: "t-1007", name: "Black Friday Deals", engagementScore: 94 },
  { id: "t-1008", name: "Cyber Monday Offers", engagementScore: 88 },
];

// Thumbnail data for existing templates
const existingTemplateThumbnails = [
  { 
    id: "t-1001", 
    name: "Winter Sale Template", 
    previewBg: "from-blue-50 to-slate-100",
    previewText: "Winter Sale",
    previewIcon: "❄️",
    engagementScore: 78
  },
  { 
    id: "t-1002", 
    name: "New Year Special", 
    previewBg: "from-yellow-50 to-amber-100",
    previewText: "New Year",
    previewIcon: "🎉",
    engagementScore: 82
  },
  { 
    id: "t-1003", 
    name: "Valentine's Day Promotion", 
    previewBg: "from-rose-50 to-pink-100",
    previewText: "Valentine's Day",
    previewIcon: "💕",
    engagementScore: 85
  },
  { 
    id: "t-1004", 
    name: "Spring Collection Announcement", 
    previewBg: "from-green-50 to-emerald-100",
    previewText: "Spring Collection",
    previewIcon: "🌸",
    engagementScore: 73
  },
  { 
    id: "t-1005", 
    name: "Summer Flash Sale", 
    previewBg: "from-orange-50 to-yellow-100",
    previewText: "Summer Sale",
    previewIcon: "☀️",
    engagementScore: 91
  },
  { 
    id: "t-1006", 
    name: "Back to School Campaign", 
    previewBg: "from-indigo-50 to-blue-100",
    previewText: "Back to School",
    previewIcon: "📚",
    engagementScore: 67
  },
  { 
    id: "t-1007", 
    name: "Black Friday Deals", 
    previewBg: "from-gray-50 to-slate-100",
    previewText: "Black Friday",
    previewIcon: "🖤",
    engagementScore: 94
  },
  { 
    id: "t-1008", 
    name: "Cyber Monday Offers", 
    previewBg: "from-purple-50 to-indigo-100",
    previewText: "Cyber Monday",
    previewIcon: "💻",
    engagementScore: 88
  },
];

// WhatsApp card content data - quirky teenagers style
const whatsappCardData = {
  card1: {
    header: "💕 OMG Valentine's is HERE!! 💕",
    body: "Hey bestie!! 😍 Can't even... our Valentine's collection is SO cute it's literally criminal!! 💅✨ Like, we're talking major heart-eyes vibes and your crush is def gonna notice 👀💖",
    footer: "P.S. Your bestie's gonna be JEALOUS 😘",
    cta1: {
      buttonType: "Website",
      ctaText: "Shop Now! 🛍️",
      websiteLink: "https://example.com/shop-now"
    },
    cta2: {
      buttonType: "Website",
      ctaText: "Browse Collection 💫",
      websiteLink: "https://example.com/browse-collection"
    },
    cta3: {
      buttonType: "Call phone number",
      ctaText: "Call Us!",
      country: "+1",
      phoneNumber: "800-555-0199"
    },
    imageUrl: "https://example.com/valentines-teen-collection.jpg"
  },
  card2: {
    header: "🔥 BRB Crying Over These Deals 🔥",
    body: "Okay but seriously... 50% OFF?? 😱 Mom's credit card is about to be STRESSED lol jk (or am I? 👀) These Valentine's looks are giving main character energy and I'm here for it!! 💯🌟",
    footer: "No cap - this sale ends tomorrow!! 😭",
    cta1: {
      buttonType: "Website",
      ctaText: "Grab Deal! 💸",
      websiteLink: "https://example.com/grab-deal"
    },
    cta2: {
      buttonType: "Call phone number",
      ctaText: "Call to Order",
      country: "+1",
      phoneNumber: "800-555-0122"
    },
    cta3: {
      buttonType: "Website",
      ctaText: "Tell a Friend 💌",
      websiteLink: "https://example.com/tell-a-friend"
    },
    imageUrl: "https://example.com/teen-deals-promo.jpg"
  },
  card3: {
    header: "💌 Plot Twist: You're The Valentine 💌",
    body: "Listen up gorgeous! 💅 Self-love era is IN and we're here to serve LOOKS!! Treat yourself like the queen you are because honestly? You deserve the world and our Valentine's collection! 👑💖",
    footer: "Stay iconic, bestie! ✨",
    cta1: {
      buttonType: "Website",
      ctaText: "Treat Yourself! 💖",
      websiteLink: "https://example.com/treat-yourself"
    },
    cta2: {
      buttonType: "Website",
      ctaText: "Self-Care Kit 🌟",
      websiteLink: "https://example.com/self-care"
    },
    cta3: {
      buttonType: "Call phone number",
      ctaText: "Join VIP Club ✨",
      country: "+1",
      phoneNumber: "800-555-0144"
    },
    imageUrl: "https://example.com/self-love-valentine.jpg"
  }
};

// Autonomous mode segment data
const autonomousSegments = [
  { id: "premium-perfume", name: "Premium Perfume Enthusiasts" },
  { id: "recent-browsers", name: "Recent Beauty Browsers" },
  { id: "loyal-shoppers", name: "Loyal Beauty Shoppers" },
  { id: "high-intent", name: "High Intent New Customers" },
  { id: "welcome-premium", name: "Welcome Premium Segment" }
];

// Collaborative mode segment data
const collaborativeSegments = [
  { id: "affinity-based", name: "Affinity Based Segment" },
  { id: "high-aov", name: "High AOV Segment" },
  { id: "seasonal-buyers", name: "Seasonal Buyers" },
  { id: "loyalty-program", name: "Loyalty Program Members" }
];

// Content data for each segment and channel in autonomous mode
const autonomousContentData = {
  email: {
    "premium-perfume": {
      subject: "VIP Access: Love's Luxury Collection",
      focus: "Exclusive luxury Valentine's collections",
      preview: "Experience the pinnacle of luxury fragrances..."
    },
    "recent-browsers": {
      subject: "First Love: Special Valentine's Offer",
      focus: "First-time buyer incentives",
      preview: "Discover your signature scent with our exclusive..."
    },
    "loyal-shoppers": {
      subject: "Members-Only Valentine's Bundle",
      focus: "Exclusive bundles and rewards",
      preview: "Thank you for your loyalty! Enjoy these exclusive..."
    },
    "high-intent": {
      subject: "Love at First Scent: 20% Off",
      focus: "New customer special offers",
      preview: "Fall in love with our Valentine's collection..."
    },
    "welcome-premium": {
      subject: "Your Perfect Valentine's Match",
      focus: "Personalized recommendations",
      preview: "Welcome to the world of premium fragrances..."
    }
  },
  apn: {
    "premium-perfume": {
      title: "Luxury Awaits 💎",
      message: "VIP Valentine's collection - exclusively for you",
      cta: "Shop VIP Collection"
    },
    "recent-browsers": {
      title: "Special Offer Inside 💕",
      message: "Your perfect Valentine's fragrance awaits",
      cta: "Claim Offer"
    },
    "loyal-shoppers": {
      title: "Members Only 🌟",
      message: "Exclusive Valentine's bundle just for you",
      cta: "View Bundle"
    },
    "high-intent": {
      title: "20% Off Valentine's 💘",
      message: "Limited time - your favorites at special prices",
      cta: "Shop Now"
    },
    "welcome-premium": {
      title: "Perfect Match Found 💖",
      message: "Personalized Valentine's recommendations ready",
      cta: "See Matches"
    }
  },
  whatsapp: {
    "premium-perfume": {
      header: "💎 VIP Valentine's Collection 💎",
      body: "Exclusive access to our most luxurious fragrances. Limited edition Valentine's collection available only to our VIP members.",
      footer: "Premium experience guaranteed ✨",
      cta1: "Shop VIP Collection",
      cta2: "Browse Luxury",
      cta3: "Contact Concierge"
    },
    "recent-browsers": {
      header: "💕 Your Perfect Scent Awaits 💕",
      body: "We noticed you've been exploring our fragrance collection. Here's a special Valentine's offer just for you - find your signature scent today!",
      footer: "Limited time offer ends soon! ⏰",
      cta1: "Shop Now",
      cta2: "Browse Collection",
      cta3: "Get 20% Off"
    },
    "loyal-shoppers": {
      header: "🌟 Members-Only Valentine's Bundle 🌟",
      body: "Thank you for being a valued customer! Enjoy exclusive access to our curated Valentine's bundle with special member pricing.",
      footer: "Your loyalty is appreciated 💖",
      cta1: "View Bundle",
      cta2: "Member Benefits",
      cta3: "Refer Friends"
    },
    "high-intent": {
      header: "💘 20% Off Valentine's Collection 💘",
      body: "Ready to find your perfect Valentine's fragrance? Enjoy 20% off our entire collection - from classic romance to modern allure.",
      footer: "Offer ends February 14th! 📅",
      cta1: "Shop 20% Off",
      cta2: "View Collection",
      cta3: "Find My Scent"
    },
    "welcome-premium": {
      header: "💖 Your Perfect Valentine's Match 💖",
      body: "Welcome to our premium fragrance family! Based on your preferences, we've curated personalized Valentine's recommendations just for you.",
      footer: "Discover your signature scent journey 🌹",
      cta1: "See My Matches",
      cta2: "Take Quiz",
      cta3: "Join VIP"
    }
  }
};

// Content data for each segment and channel in collaborative mode
const collaborativeContentData = {
  email: {
    "affinity-based": {
      subject: "Exclusive Valentine's Collection - Just for You",
      focus: "Personalized recommendations based on browsing history",
      preview: "Your perfect Valentine's fragrance awaits..."
    },
    "high-aov": {
      subject: "Premium Valentine's Gifts Worth Your Investment",
      focus: "High-value product recommendations",
      preview: "Discover luxury fragrances that make a statement..."
    },
    "seasonal-buyers": {
      subject: "Valentine's Special - Limited Time Offers",
      focus: "Seasonal promotions and urgency",
      preview: "Don't miss out on our Valentine's Day specials..."
    },
    "loyalty-program": {
      subject: "Member Exclusive: Valentine's VIP Access",
      focus: "Loyalty rewards and exclusive access",
      preview: "Your loyalty deserves the best Valentine's gifts..."
    }
  },
  apn: {
    "affinity-based": {
      title: "Perfect Match Found 💕",
      message: "Curated Valentine's picks based on your preferences",
      cta: "Shop My Picks"
    },
    "high-aov": {
      title: "Premium Valentine's 💎",
      message: "Luxury fragrances for the discerning buyer",
      cta: "Explore Premium"
    },
    "seasonal-buyers": {
      title: "Valentine's Flash Sale 🌹",
      message: "Limited time offers on seasonal favorites",
      cta: "Shop Sale"
    },
    "loyalty-program": {
      title: "VIP Access 🌟",
      message: "Exclusive Valentine's member benefits",
      cta: "View Benefits"
    }
  },
  whatsapp: {
    "affinity-based": {
      header: "💕 Your Perfect Valentine's Match 💕",
      body: "Based on your preferences, we've curated special Valentine's recommendations just for you. These fragrances align perfectly with your style and taste.",
      footer: "Personalized just for you ✨",
      cta1: "Shop My Picks",
      cta2: "Browse Collection",
      cta3: "Get More Recommendations"
    },
    "high-aov": {
      header: "💎 Premium Valentine's Collection 💎",
      body: "Indulge in our most luxurious fragrances this Valentine's Day. These premium selections offer exceptional quality and lasting impressions.",
      footer: "Luxury redefined 🌟",
      cta1: "Explore Premium",
      cta2: "View Collection",
      cta3: "Contact Personal Shopper"
    },
    "seasonal-buyers": {
      header: "🌹 Valentine's Flash Sale Alert 🌹",
      body: "Don't miss our limited-time Valentine's offers! These seasonal favorites are available at special prices for a limited time only.",
      footer: "Limited time offer ends soon! ⏰",
      cta1: "Shop Sale",
      cta2: "View All Offers",
      cta3: "Set Reminder"
    },
    "loyalty-program": {
      header: "🌟 VIP Valentine's Access 🌟",
      body: "Your loyalty deserves the best! Enjoy exclusive access to our Valentine's collection with special member pricing and early access privileges.",
      footer: "Thank you for being a valued member 💖",
      cta1: "View VIP Benefits",
      cta2: "Shop Member Prices",
      cta3: "Refer Friends"
    }
  }
};

export function ContentAgentResponse({
  emailContent,
  apnContent,
  whatsappContent,
  isPlanMode,
  onContentChanged,
  onUpdateContent,
  onDiscardChanges,
  updateHandlers,
  updatedContent,
}: ContentAgentResponseProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("template1");
  const [openCombobox, setOpenCombobox] = useState(false);
  const [openSegmentCombobox, setOpenSegmentCombobox] = useState(false);
  const [selectedExistingTemplate, setSelectedExistingTemplate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Collaborative mode content data state
  const [collaborativeContentDataState, setCollaborativeContentDataState] = useState(
    updatedContent?.collaborativeContentData || collaborativeContentData
  );

  // WhatsApp component state
  const [activeWhatsAppCard, setActiveWhatsAppCard] = useState<string>("card1");
  const [whatsappData, setWhatsappData] = useState(
    updatedContent?.whatsappData || whatsappCardData
  );

  // WhatsApp components state
  const [whatsappTextData, setWhatsappTextData] = useState(updatedContent?.whatsappTextData || null);
  const [whatsappCarouselData, setWhatsappCarouselData] = useState(updatedContent?.whatsappCarouselData || null);
  const [whatsappMediaData, setWhatsappMediaData] = useState(updatedContent?.whatsappMediaData || null);

  const [openCtaPopover, setOpenCtaPopover] = useState<'cta1' | 'cta2' | 'cta3' | null>(null);
  const [openButtonTypeCombobox, setOpenButtonTypeCombobox] = useState(false);
  const [buttonType, setButtonType] = useState<string>("Website");
  const [buttonValue, setButtonValue] = useState<string>("");

  // Collaborative mode segment selection state
  const [selectedCollaborativeSegment, setSelectedCollaborativeSegment] = useState<string>(
    updatedContent?.selectedSegment || "affinity-based"
  );
  
  // Autonomous mode segment selection state
  const [selectedEmailSegment, setSelectedEmailSegment] = useState<string>("premium-perfume");
  const [selectedApnSegment, setSelectedApnSegment] = useState<string>("premium-perfume");
  const [selectedWhatsappSegment, setSelectedWhatsappSegment] = useState<string>("premium-perfume");
  
  // Autonomous mode content data state  
  const [contentData, setContentData] = useState(autonomousContentData);

  // Collab mode App Push state
  const [collabApnTitle, setCollabApnTitle] = useState<string>("Fall in love 💖");
  const [collabApnMessage, setCollabApnMessage] = useState<string>("Celebrate Valentine's Day with 25% off our fragrance collection.");
  const [collabApnCta, setCollabApnCta] = useState<string>("Shop now");

  // Original values for collaborative mode
  const [originalCollaborativeContentData, setOriginalCollaborativeContentData] = useState(
    updatedContent?.collaborativeContentData || collaborativeContentData
  );
  const [originalCollabApnTitle, setOriginalCollabApnTitle] = useState<string>("Fall in love 💖");
  const [originalCollabApnMessage, setOriginalCollabApnMessage] = useState<string>("Celebrate Valentine's Day with 25% off our fragrance collection.");
  const [originalCollabApnCta, setOriginalCollabApnCta] = useState<string>("Shop now");

  // Original WhatsApp data
  const [originalWhatsappData, setOriginalWhatsappData] = useState(
    updatedContent?.whatsappData || whatsappCardData
  );

  // Initialize original values on component mount (only once)
  useEffect(() => {
    // Only set original values if they haven't been set yet and we have updated content
    if (updatedContent) {
      setOriginalCollaborativeContentData(updatedContent.collaborativeContentData);
      setOriginalWhatsappData(updatedContent.whatsappData);
    }
  }, []);

  // Effect to track changes in collaborative content
  useEffect(() => {
    if (!isPlanMode) {
      const hasContentDataChanges = JSON.stringify(collaborativeContentDataState) !== JSON.stringify(originalCollaborativeContentData);
      const hasWhatsappDataChanges = JSON.stringify(whatsappData) !== JSON.stringify(originalWhatsappData);
      const hasChanges = hasContentDataChanges || hasWhatsappDataChanges;
      onContentChanged?.(hasChanges);
    }
  }, [collaborativeContentDataState, originalCollaborativeContentData, whatsappData, originalWhatsappData, onContentChanged, isPlanMode]);

  // Handle update content action
  const handleUpdateContent = () => {
    const updatedContent = {
      collaborativeContentData: collaborativeContentDataState,
      whatsappData: whatsappData,
      selectedSegment: selectedCollaborativeSegment
    };
    onUpdateContent?.(updatedContent);
  };

  // Handle discard changes action
  const handleDiscardChanges = () => {
    setCollaborativeContentDataState(originalCollaborativeContentData);
    setWhatsappData(originalWhatsappData);
    onDiscardChanges?.();
  };

  // Expose handlers to parent component
  useEffect(() => {
    if (!isPlanMode && updateHandlers) {
      updateHandlers.handleUpdate = handleUpdateContent;
      updateHandlers.handleDiscard = handleDiscardChanges;
    }
  }, [isPlanMode, handleUpdateContent, handleDiscardChanges, updateHandlers]);

  // Handle thumbnail selection - clear dropdown selection
  const handleThumbnailSelect = (value: string) => {
    setSelectedTemplate(value);
    setSelectedExistingTemplate("");
  };

  // Handle dropdown selection - clear thumbnail selection
  const handleDropdownSelect = (id: string) => {
    setSelectedExistingTemplate(id);
    setSelectedTemplate("");
    setOpenCombobox(false);
  };

  const filteredTemplates = existingTemplates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle WhatsApp field updates
  const updateWhatsappField = (field: string, value: string) => {
    setWhatsappData(prev => ({
      ...prev,
      [activeWhatsAppCard]: {
        ...prev[activeWhatsAppCard as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const updateWhatsappCtaField = (ctaKey: 'cta1' | 'cta2' | 'cta3', field: string, value: string) => {
    setWhatsappData(prev => {
        const newWhatsappData = JSON.parse(JSON.stringify(prev));
        const cta = newWhatsappData[activeWhatsAppCard as keyof typeof newWhatsappData][ctaKey];
        cta[field] = value;

        if (field === 'buttonType') {
            if (value === 'Website') {
                delete cta.country;
                delete cta.phoneNumber;
                cta.websiteLink = cta.websiteLink || '';
            } else if (value === 'Call phone number') {
                delete cta.websiteLink;
                cta.country = cta.country || '';
                cta.phoneNumber = cta.phoneNumber || '';
            }
        }
        return newWhatsappData;
    });
  };


  // Autonomous mode content components
  const autonomousEmailContent = (
    <div className="space-y-5">
      {/* Segment Dropdown */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Preview content for segment:</p>
        <div className="w-[400px]">
          <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSegmentCombobox}
                className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
              >
                {selectedEmailSegment
                  ? autonomousSegments.find((segment) => segment.id === selectedEmailSegment)?.name
                  : "Select a segment..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
              <div className="p-1">
                {autonomousSegments.map((segment) => (
                  <div
                    key={segment.id}
                    onClick={() => {
                      setSelectedEmailSegment(segment.id);
                      setOpenSegmentCombobox(false);
                    }}
                    className={cn(
                      "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                      selectedEmailSegment === segment.id 
                        ? "bg-[#E7F0FF]" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="font-medium">{segment.name}</span>
                    {selectedEmailSegment === segment.id && (
                      <Check className="h-4 w-4 text-[#143F93]" />
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Subject Line Field */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">Subject line</Label>
        <Input
          value={contentData.email[selectedEmailSegment as keyof typeof contentData.email].subject}
          onChange={(e) => {
            const updatedData = { ...contentData };
            updatedData.email[selectedEmailSegment as keyof typeof contentData.email].subject = e.target.value;
            setContentData(updatedData);
          }}
          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
        />
      </div>


    </div>
  );

  const autonomousApnContent = (
    <div className="space-y-5">
      {/* Segment Dropdown */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Preview content for segment:</p>
        <div className="w-[400px]">
          <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openSegmentCombobox}
                className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
              >
                {selectedApnSegment
                  ? autonomousSegments.find((segment) => segment.id === selectedApnSegment)?.name
                  : "Select a segment..."}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
              <div className="p-1">
                {autonomousSegments.map((segment) => (
                  <div
                    key={segment.id}
                    onClick={() => {
                      setSelectedApnSegment(segment.id);
                      setOpenSegmentCombobox(false);
                    }}
                    className={cn(
                      "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                      selectedApnSegment === segment.id 
                        ? "bg-[#E7F0FF]" 
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    <span className="font-medium">{segment.name}</span>
                    {selectedApnSegment === segment.id && (
                      <Check className="h-4 w-4 text-[#143F93]" />
                    )}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Dynamic Content Based on Selected Segment */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Title</Label>
          <Input
            value={contentData.apn[selectedApnSegment as keyof typeof contentData.apn].title}
            onChange={(e) => {
              const updatedData = { ...contentData };
              updatedData.apn[selectedApnSegment as keyof typeof contentData.apn].title = e.target.value;
              setContentData(updatedData);
            }}
            className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Message</Label>
          <Textarea
            value={contentData.apn[selectedApnSegment as keyof typeof contentData.apn].message}
            onChange={(e) => {
              const updatedData = { ...contentData };
              updatedData.apn[selectedApnSegment as keyof typeof contentData.apn].message = e.target.value;
              setContentData(updatedData);
            }}
            className="border-border shadow-none resize-none min-h-[60px] focus:border-border focus:ring-0 hover:border-border"
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium text-muted-foreground">Call to Action</Label>
          <Input
            value={contentData.apn[selectedApnSegment as keyof typeof contentData.apn].cta}
            onChange={(e) => {
              const updatedData = { ...contentData };
              updatedData.apn[selectedApnSegment as keyof typeof contentData.apn].cta = e.target.value;
              setContentData(updatedData);
            }}
            className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border"
          />
        </div>
      </div>
    </div>
  );


  // Custom email content with template selection and segment-based content
  const customEmailContent = (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-600">Subject line</Label>
        <Input
          value={collaborativeContentDataState.email[selectedCollaborativeSegment as keyof typeof collaborativeContentDataState.email].subject}
          onChange={(e) => {
            const updatedData = JSON.parse(JSON.stringify(collaborativeContentDataState));
            updatedData.email[selectedCollaborativeSegment as keyof typeof updatedData.email].subject = e.target.value;
            setCollaborativeContentDataState(updatedData);
          }}
          placeholder="Enter email subject line"
          className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
        />
      </div>
      
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Content agent suggests:</h3>
      
      <RadioGroup 
        value={selectedTemplate} 
        onValueChange={handleThumbnailSelect}
        className="grid grid-cols-3 gap-4"
      >
        {templateThumbnails.map((template) => {
          const isSelected = selectedTemplate === template.id;
          return (
            <div key={template.id} className="relative">
              <div className={cn(
                "absolute top-2 left-2 z-10",
                isSelected ? "opacity-100" : "opacity-70"
              )}>
                <RadioGroupItem 
                  value={template.id} 
                  id={template.id} 
                  className="mr-1 border-[#143F93] text-[#143F93] data-[state=checked]:border-[#143F93] data-[state=checked]:text-[#143F93] focus-visible:ring-[#143F93]" 
                />
              </div>
              <label
                htmlFor={template.id}
                className={cn(
                  "cursor-pointer block transition-all duration-200 rounded-md overflow-hidden",
                  isSelected 
                    ? "ring-2 ring-[#143F93] shadow-md" 
                    : "ring-1 ring-gray-200 hover:ring-2 hover:ring-[#143F93]/50 hover:shadow-md"
                )}
              >
                <div className="relative pt-[65%] overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Template preview - in production this would be an actual image */}
                    <div className={cn(
                      "w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-2",
                      template.previewBg
                    )}>
                      <div className="text-2xl mb-1">{template.previewIcon}</div>
                            <div className="bg-white/70 px-3 py-1 rounded-full">
                              <span className="text-xs font-medium text-gray-700">{template.previewText}</span>
                            </div>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs font-medium text-gray-700 dark:text-white truncate">
                    {template.name}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="text-[10px] text-gray-500 dark:text-gray-300">
                      ID: {template.templateId}
                    </div>
                    <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                    <EngagementScore score={template.engagementScore} />
                  </div>
                </div>
              </label>
            </div>
          );
        })}
      </RadioGroup>
      
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400">Select from existing templates:</p>
        <div className="w-full max-w-[400px]">
          <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCombobox}
                className="w-full justify-between border-gray-200 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                {selectedExistingTemplate
                  ? existingTemplates.find((template) => template.id === selectedExistingTemplate)?.name
                  : "Select a template..."}
                {selectedExistingTemplate ? (
                  <X 
                    className="ml-1 h-4 w-4 shrink-0 text-gray-400 hover:text-gray-600" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedExistingTemplate("");
                      if (!selectedTemplate) {
                        setSelectedTemplate("template1"); // Default back to first template
                      }
                    }}
                  />
                ) : (
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0 border-gray-200 shadow-lg dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="h-9 w-full border-0 border-b border-gray-200 dark:border-gray-700 pl-9 pr-3 py-2 text-sm outline-none focus:ring-0 placeholder:text-gray-400"
                />
              </div>
              <div className="max-h-[200px] overflow-auto p-1">
                {filteredTemplates.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    No templates found.
                  </div>
                ) : (
                  filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => handleDropdownSelect(template.id)}
                      className={cn(
                        "flex items-center justify-between py-3 px-3 rounded-md cursor-pointer transition-colors",
                        selectedExistingTemplate === template.id 
                          ? "bg-[#E7F0FF] text-gray-900 dark:bg-[#1E3A8A] dark:text-white" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className="flex flex-col flex-1">
                        <span className="font-medium text-sm">{template.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs",
                            selectedExistingTemplate === template.id 
                              ? "text-gray-600 dark:text-gray-300" 
                              : "text-gray-500 dark:text-gray-400"
                          )}>
                            ID: {template.id}
                          </span>
                          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                          <EngagementScore score={template.engagementScore} />
                        </div>
                      </div>
                      {selectedExistingTemplate === template.id && (
                        <Check className="h-4 w-4 text-[#143F93] dark:text-blue-400 ml-2" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        {/* Thumbnail preview for selected existing template */}
        {selectedExistingTemplate && (
          <div className="mt-3">
            {(() => {
              const thumbnailData = existingTemplateThumbnails.find(t => t.id === selectedExistingTemplate);
              if (!thumbnailData) return null;
              
              return (
                <div className="grid grid-cols-3 gap-4">
                  <div className="relative">
                    <div className="rounded-md overflow-hidden ring-1 ring-gray-200">
                      <div className="relative pt-[65%] overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className={cn(
                            "w-full h-full bg-gradient-to-br flex flex-col items-center justify-center p-2",
                            thumbnailData.previewBg
                          )}>
                            <div className="text-2xl mb-1">{thumbnailData.previewIcon}</div>
                            <div className="bg-white/70 px-3 py-1 rounded-full">
                              <span className="text-xs font-medium text-gray-700">{thumbnailData.previewText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-xs font-medium text-gray-700 dark:text-white truncate">
                          {thumbnailData.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="text-[10px] text-gray-500 dark:text-gray-300">
                            ID: {thumbnailData.id}
                          </div>
                          <div className="w-px h-3 bg-gray-300 dark:bg-gray-600"></div>
                          <EngagementScore score={thumbnailData.engagementScore} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );

  // Custom App Push content for collaborative mode with segment-based content
  const customApnContent = (
    <div className="space-y-5">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Content agent suggests:</h3>

      <div className="space-y-3">
        {/* Title Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Title</Label>
          <Input
            value={collaborativeContentDataState.apn[selectedCollaborativeSegment as keyof typeof collaborativeContentDataState.apn].title}
            onChange={(e) => {
              const updatedData = JSON.parse(JSON.stringify(collaborativeContentDataState));
              updatedData.apn[selectedCollaborativeSegment as keyof typeof updatedData.apn].title = e.target.value;
              setCollaborativeContentDataState(updatedData);
            }}
            placeholder="Enter push title"
            className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
          />
        </div>

        {/* Message Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Message</Label>
          <Textarea
            value={collaborativeContentDataState.apn[selectedCollaborativeSegment as keyof typeof collaborativeContentDataState.apn].message}
            onChange={(e) => {
              const updatedData = JSON.parse(JSON.stringify(collaborativeContentDataState));
              updatedData.apn[selectedCollaborativeSegment as keyof typeof updatedData.apn].message = e.target.value;
              setCollaborativeContentDataState(updatedData);
            }}
            placeholder="Enter push message"
            className="border-border shadow-none resize-none min-h-[60px] focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
          />
        </div>

        {/* CTA Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-600">Call to Action</Label>
          <Input
            value={collaborativeContentDataState.apn[selectedCollaborativeSegment as keyof typeof collaborativeContentDataState.apn].cta}
            onChange={(e) => {
              const updatedData = JSON.parse(JSON.stringify(collaborativeContentDataState));
              updatedData.apn[selectedCollaborativeSegment as keyof typeof updatedData.apn].cta = e.target.value;
              setCollaborativeContentDataState(updatedData);
            }}
            placeholder="Enter CTA"
            className="border-border shadow-none focus:border-border focus:ring-0 hover:border-border bg-gray-50 dark:bg-gray-900/40"
          />
        </div>

        {/* Engagement Score */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <EngagementScore score={85} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <p className="mb-3 text-sm">
        {updatedContent 
          ? "Here is the revised content reflecting your edits. Feel free to approve it or request further tweaks."
          : "Using your inputs and the confirmed content strategy, I've prepared content for each channel of the campaign:"
        }
      </p>
      
      {/* Collaborative Mode Segment Dropdown - positioned outside and above accordions */}
      {!isPlanMode && (
        <div className="mb-4 space-y-2">
          <p className="text-sm text-muted-foreground">View content for segment:</p>
          <div className="w-[400px]">
            <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openSegmentCombobox}
                  className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
                >
                  {selectedCollaborativeSegment
                    ? collaborativeSegments.find((segment) => segment.id === selectedCollaborativeSegment)?.name
                    : "Select a segment..."}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
                <div className="p-1">
                  {collaborativeSegments.map((segment) => (
                    <div
                      key={segment.id}
                      onClick={() => {
                        setSelectedCollaborativeSegment(segment.id);
                        setOpenSegmentCombobox(false);
                      }}
                      className={cn(
                        "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                        selectedCollaborativeSegment === segment.id 
                          ? "bg-gray-100 dark:bg-gray-800" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      )}
                    >
                      <span className="font-medium">{segment.name}</span>
                      {selectedCollaborativeSegment === segment.id && (
                        <Check className="h-4 w-4 text-[#143F93]" />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <Accordion type="single" collapsible defaultValue="email" className="w-full">
          <AccordionItem value="email" className="border-b-0 last:border-0">
            <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center text-gray-500">
                  <Mail className="h-5 w-5" />
                </span>
                <span>Email</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
              {isPlanMode ? autonomousEmailContent : (emailContent || customEmailContent)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="apn" className="border-b-0 last:border-0">
            <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center text-gray-500">
                  <BellRing className="h-5 w-5" />
                </span>
                <span>App push</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
              {isPlanMode ? autonomousApnContent : (apnContent || customApnContent)}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatsapp-text" className="border-b-0">
            <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center text-gray-500">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span>WhatsApp - Text Based</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
              {isPlanMode ? (
                <div className="space-y-5">
                  {/* Segment Dropdown */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Preview content for segment:</p>
                    <div className="w-[400px]">
                      <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSegmentCombobox}
                            className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
                          >
                            {selectedWhatsappSegment
                              ? autonomousSegments.find((segment) => segment.id === selectedWhatsappSegment)?.name
                              : "Select a segment..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
                          <div className="p-1">
                            {autonomousSegments.map((segment) => (
                              <div
                                key={segment.id}
                                onClick={() => {
                                  setSelectedWhatsappSegment(segment.id);
                                  setOpenSegmentCombobox(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                                  selectedWhatsappSegment === segment.id 
                                    ? "bg-[#E7F0FF]" 
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                              >
                                <span className="font-medium">{segment.name}</span>
                                {selectedWhatsappSegment === segment.id && (
                                  <Check className="h-4 w-4 text-[#143F93]" />
                                )}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <WhatsAppTextBased
                    data={whatsappTextData}
                    onDataChange={setWhatsappTextData}
                  />
                </div>
              ) : (
                <WhatsAppTextBased
                  data={whatsappTextData}
                  onDataChange={setWhatsappTextData}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatsapp-carousel" className="border-b-0">
            <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center text-gray-500">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span>WhatsApp - Carousel Based</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
              {isPlanMode ? (
                <div className="space-y-5">
                  {/* Segment Dropdown */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Preview content for segment:</p>
                    <div className="w-[400px]">
                      <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSegmentCombobox}
                            className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
                          >
                            {selectedWhatsappSegment
                              ? autonomousSegments.find((segment) => segment.id === selectedWhatsappSegment)?.name
                              : "Select a segment..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
                          <div className="p-1">
                            {autonomousSegments.map((segment) => (
                              <div
                                key={segment.id}
                                onClick={() => {
                                  setSelectedWhatsappSegment(segment.id);
                                  setOpenSegmentCombobox(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                                  selectedWhatsappSegment === segment.id 
                                    ? "bg-[#E7F0FF]" 
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                              >
                                <span className="font-medium">{segment.name}</span>
                                {selectedWhatsappSegment === segment.id && (
                                  <Check className="h-4 w-4 text-[#143F93]" />
                                )}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <WhatsAppCarouselBased
                    data={whatsappCarouselData}
                    onDataChange={setWhatsappCarouselData}
                  />
                </div>
              ) : (
                <WhatsAppCarouselBased
                  data={whatsappCarouselData}
                  onDataChange={setWhatsappCarouselData}
                />
              )}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="whatsapp-media" className="border-b-0 last:border-0">
            <AccordionTrigger className="font-medium py-3 px-4 hover:no-underline hover:bg-gray-50 dark:hover:bg-gray-900">
              <div className="flex items-center gap-2">
                <span className="h-6 w-6 flex items-center justify-center text-gray-500">
                  <MessageSquare className="h-5 w-5" />
                </span>
                <span>WhatsApp - Media Based</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
              {isPlanMode ? (
                <div className="space-y-5">
                  {/* Segment Dropdown */}
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Preview content for segment:</p>
                    <div className="w-[400px]">
                      <Popover open={openSegmentCombobox} onOpenChange={setOpenSegmentCombobox}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openSegmentCombobox}
                            className="w-full justify-between border-border bg-background hover:bg-muted text-foreground hover:text-foreground"
                          >
                            {selectedWhatsappSegment
                              ? autonomousSegments.find((segment) => segment.id === selectedWhatsappSegment)?.name
                              : "Select a segment..."}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0 border-border shadow-lg" align="start">
                          <div className="p-1">
                            {autonomousSegments.map((segment) => (
                              <div
                                key={segment.id}
                                onClick={() => {
                                  setSelectedWhatsappSegment(segment.id);
                                  setOpenSegmentCombobox(false);
                                }}
                                className={cn(
                                  "flex items-center justify-between py-2 px-2 rounded-md text-foreground cursor-pointer",
                                  selectedWhatsappSegment === segment.id 
                                    ? "bg-[#E7F0FF]" 
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                )}
                              >
                                <span className="font-medium">{segment.name}</span>
                                {selectedWhatsappSegment === segment.id && (
                                  <Check className="h-4 w-4 text-[#143F93]" />
                                )}
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <WhatsAppMediaBased
                    data={whatsappMediaData}
                    onDataChange={setWhatsappMediaData}
                  />
                </div>
              ) : (
                <WhatsAppMediaBased
                  data={whatsappMediaData}
                  onDataChange={setWhatsappMediaData}
                />
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
} 