import React from 'react';
import { NipunLogo } from '../common/NipunLogo';
import { ExternalLink, ShieldCheck, Database, Award } from 'lucide-react';

export const GovFooter: React.FC = () => {
  return (
    <footer className="bg-[#000a1e] text-white border-t border-[#002147] pt-16 pb-12 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#002147]/80">
          {/* Brand & Purpose */}
          <div className="lg:col-span-2 space-y-4">
            <NipunLogo variant="horizontal" size="md" lightModeText={true} />
            <p className="text-xs sm:text-sm text-[#c4c6cf] leading-relaxed max-w-sm">
              National Initiative for Statistical Proficiency, Competency Intelligence &amp; Capacity Building Platform for the Indian Statistical System (MoSPI / NSSTA).
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#002147] text-[11px] text-[#fe9832] font-semibold border border-[#fe9832]/30">
                <ShieldCheck className="w-3.5 h-3.5" /> DPDP Act 2023 Aligned
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#002147] text-[11px] text-[#8e9099] font-medium">
                <Award className="w-3.5 h-3.5" /> Mission Karmayogi
              </span>
            </div>
          </div>

          {/* Column 1: Framework */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#fe9832]">
              Competency Pillars
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c6cf]">
              <li className="hover:text-white transition-colors cursor-pointer">Official Statistics Methods</li>
              <li className="hover:text-white transition-colors cursor-pointer">Sample Survey Design</li>
              <li className="hover:text-white transition-colors cursor-pointer">National Accounts (SNA 2008)</li>
              <li className="hover:text-white transition-colors cursor-pointer">Python & R Statistical Computing</li>
              <li className="hover:text-white transition-colors cursor-pointer">Data Privacy & Microdata SDC</li>
            </ul>
          </div>

          {/* Column 2: Institutional Adapters */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#fe9832]">
              Ecosystem Adapters
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c6cf]">
              <li className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                iGOT Karmayogi API <ExternalLink className="w-3 h-3 text-[#8e9099]" />
              </li>
              <li className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer">
                NSSTA Training Calendar <ExternalLink className="w-3 h-3 text-[#8e9099]" />
              </li>
              <li className="hover:text-white transition-colors cursor-pointer">TPAC Recommendation Sync</li>
              <li className="hover:text-white transition-colors cursor-pointer">MoSPI SPARROW Cadre Data</li>
              <li className="hover:text-white transition-colors cursor-pointer">National Data Sharing Policy</li>
            </ul>
          </div>

          {/* Column 3: Partner Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#fe9832]">
              Partner Entities
            </h4>
            <ul className="space-y-2 text-xs text-[#c4c6cf]">
              <li className="hover:text-white transition-colors cursor-pointer">MoSPI, Government of India</li>
              <li className="hover:text-white transition-colors cursor-pointer">NSSTA Greater Noida</li>
              <li className="hover:text-white transition-colors cursor-pointer">Capacity Building Commission (CBC)</li>
              <li className="hover:text-white transition-colors cursor-pointer">DoPT, Karmayogi Bharat</li>
              <li className="hover:text-white transition-colors cursor-pointer">National Informatics Centre (NIC)</li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Security Disclaimer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#8e9099] gap-4">
          <p>© 2026 NIPUN - National Statistical Competency Platform. Developed for MoSPI, Government of India.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-[#c4c6cf] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#c4c6cf] cursor-pointer">Data Privacy Policy</span>
            <span className="hover:text-[#c4c6cf] cursor-pointer">Security Audits</span>
            <span className="hover:text-[#c4c6cf] cursor-pointer">Accessibility Statement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
