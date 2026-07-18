import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AtmosphereProvider } from "@/contexts/AtmosphereContext";
import { DecisioningSetupProvider } from "@/contexts/DecisioningSetupContext";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Campaigns from "./pages/Campaigns";
import DecisioningEngine from "./pages/DecisioningEngine";
import DecisioningSetup from "./pages/DecisioningSetup";
import ObjectiveCreationFlow from "./components/decisioning/ObjectiveCreationFlow";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AtmosphereProvider>
        <DecisioningSetupProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/campaigns" element={<Campaigns />} />
              <Route path="/decisioning-engine" element={<DecisioningEngine />} />
              <Route path="/decisioning-engine/setup" element={<DecisioningSetup />} />
              <Route path="/decisioning-engine/objective/new" element={<ObjectiveCreationFlow />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </DecisioningSetupProvider>
      </AtmosphereProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
