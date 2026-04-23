import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldCheck, Info, Users, Clock, Trophy, FileText } from "lucide-react";

interface ContestRulesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContestRules = ({ open, onOpenChange }: ContestRulesProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="p-6 pb-2 flex-shrink-0">
          <DialogTitle className="text-2xl font-display font-bold flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Official Contest Rules
          </DialogTitle>
          <DialogDescription>
            Please read the rules and guidelines for the "Are You AI Ready?" Global Campaign.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1" style={{ maxHeight: 'calc(85vh - 110px)', overflowY: 'auto' }}>
          <div className="space-y-8 p-6 pt-4 pb-8">
            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                1. Eligibility
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The "Are You AI Ready?" contest is open to professionals, leaders, and institutions worldwide. 
                Participants must be at least 18 years of age. Employees of DS Consortium and its affiliates are 
                eligible to participate but may be excluded from certain prize categories.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                2. Contest Period
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                The contest begins on February 1, 2026, and will run through November 30, 2026. 
                Monthly winners will be announced on the 15th of each following month.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                3. How to Enter
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                <li>Register or Sign In on <strong>dsconsortium.com</strong>.</li>
                <li>Choose one of the 8 <strong>DSC Filters</strong> that represents your AI identity.</li>
                <li>Record a video declaration (max 60 seconds) following the provided prompt.</li>
                <li>Submit your video to the public gallery.</li>
                <li>Share your declaration on LinkedIn, WhatsApp, or Instagram using the hashtag <strong>#IAmAIReady</strong>.</li>
              </ul>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                4. Content Guidelines
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Videos must be original and should not contain any copyrighted material, offensive language, 
                or confidential institutional data. DS Consortium reserves the right to remove any content that 
                violates these standards.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                5. Judging &amp; Voting
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Winners will be selected based on a combination of community votes (40%) and a panel of 
                experts from the DS Consortium (60%). Criteria include clarity of vision, alignment with 
                responsible AI principles, and community impact.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3">6. Prizes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Monthly winners will receive recognition across DS Consortium platforms and may be eligible
                for exclusive access to premium events, masterclasses, and partnership opportunities.
                Grand prize winners for the annual campaign will be announced in December 2026.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3">7. Intellectual Property</h3>
              <p className="text-muted-foreground leading-relaxed">
                Participants retain ownership of their submitted content. By submitting, participants grant
                DS Consortium a non-exclusive, royalty-free, worldwide license to use, reproduce, display,
                and distribute the content for promotional and educational purposes related to the campaign.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3">8. Disqualification</h3>
              <p className="text-muted-foreground leading-relaxed">
                DS Consortium reserves the right to disqualify any participant who engages in fraudulent
                activity, vote manipulation, or any behaviour that violates the spirit of the campaign.
                Decisions made by the judging panel are final.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3">9. Privacy</h3>
              <p className="text-muted-foreground leading-relaxed">
                Personal data collected during registration will be handled in accordance with DS Consortium's
                Privacy Policy available at <strong>dsconsortium.com/privacy</strong>. Participants may opt out
                of marketing communications at any time.
              </p>
            </section>

            <section>
              <h3 className="font-bold text-lg mb-3">10. Governing Law</h3>
              <p className="text-muted-foreground leading-relaxed">
                This contest is governed by the laws applicable to DS Consortium's principal place of business.
                Any disputes arising from this contest shall be resolved through binding arbitration.
              </p>
            </section>

            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-sm text-primary font-medium">
                By submitting a video, you grant DS Consortium a non-exclusive license to use the content 
                for promotional purposes within the Knowledge Lab and across social media platforms.
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
