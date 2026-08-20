'use client';
import React from 'react';
import Sidebar from '@/components/Sidebar';
import { MessageCircle, Mail, Globe, Verified, ArrowRight, Sparkles, Zap, Shield, ExternalLink } from 'lucide-react';

const AdminSupport = () => {
    return (
        <div className="flex min-h-screen bg-[#fcfcfd] font-['Manrope'] overflow-hidden selection:bg-[#0b193c] selection:text-white">
            <Sidebar role="admin" userName="Institution Head" userSubtitle="Admin Portal" />
            
            <main className="flex-1 relative flex items-center justify-center p-6 sm:p-12 overflow-y-auto h-screen box-border">
                
                {/* Subtle Artistic Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#0b193c]/[0.02] rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#1b5e20]/[0.02] rounded-full blur-[80px]"></div>
                </div>

                {/* Main Content Layout */}
                <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10 animate-fade-in">
                    
                    {/* Left: Branding & Bio (7 Cols) */}
                    <div className="lg:col-span-7 flex flex-col gap-10 text-center lg:text-left">
                        <div>
                            <div className="inline-flex items-center gap-3 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg mb-6">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[2px]">Verified Specialist</span>
                            </div>
                            <h1 className="text-6xl sm:text-7xl font-black text-[#0b193c] leading-[0.9] tracking-tighter mb-4">
                                Muhammad <br/> <span className="text-[#1b5e20]">Tayyab</span>
                            </h1>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-[4px] ml-1 flex items-center justify-center lg:justify-start gap-3">
                                <Zap className="w-4 h-4 text-orange-400 fill-orange-400" />
                                Web Architect & SEO Expert
                            </p>
                        </div>

                        <div className="relative">
                            <div className="text-2xl sm:text-3xl font-bold text-slate-700 leading-snug tracking-tight max-w-xl">
                                "I build <span className="text-[#0b193c]">high-performance</span> digital ecosystems. From complex portals to strategic SEO, I scale brands with precision."
                            </div>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-6">
                            <div className="flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <Globe className="w-4 h-4 text-[#1b5e20]" />
                                <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Trend Tijarat</span>
                            </div>
                            <div className="flex -space-x-2">
                                {[1,2,3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                                        {i === 1 ? 'MT' : i === 2 ? 'JS' : 'AK'}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Premium Concierge Actions (5 Cols) */}
                    <div className="lg:col-span-5">
                        <div className="bg-white rounded-[48px] p-2 border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)]">
                            <div className="bg-[#fcfcfd] rounded-[40px] p-10 flex flex-col gap-10">
                                
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-xl font-black text-[#0b193c]">Connect for</h3>
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Verified className="w-4 h-4 text-blue-500" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Urgent Assistance</p>
                                </div>

                                <div className="flex flex-col gap-4">
                                    {/* WhatsApp CTA - Sleeker, Refined Design */}
                                    <a 
                                        href="https://wa.me/923390116043?text=Hi%20Tayyab%2C%20Urgent%20Support%20Required" 
                                        target="_blank"
                                        className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl transition-all duration-500 hover:border-[#1b5e20] hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#1b5e20] group-hover:bg-[#1b5e20] group-hover:text-white transition-all duration-500">
                                                <MessageCircle className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Instant Messenger</div>
                                                <div className="text-base font-black text-[#1a1c1e]">WhatsApp Support</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1b5e20]" />
                                        </div>
                                    </a>

                                    {/* Email CTA */}
                                    <a 
                                        href="mailto:tayyabofficial99@gmail.com" 
                                        className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl transition-all duration-500 hover:border-[#0b193c] hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0b193c] group-hover:bg-[#0b193c] group-hover:text-white transition-all duration-500">
                                                <Mail className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Professional Inquiry</div>
                                                <div className="text-base font-black text-[#1a1c1e]">Email Support</div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0b193c]" />
                                        </div>
                                    </a>
                                </div>

                                {/* Institutional Backbone Footer */}
                                <div className="pt-8 border-t border-slate-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Shield className="w-4 h-4 text-[#1b5e20]" />
                                        <h4 className="text-[11px] font-black text-[#1b5e20] uppercase tracking-[3px]">Institutional Backbone</h4>
                                    </div>
                                    <p className="text-[12px] font-bold text-slate-500 leading-relaxed">
                                        This support portal is designed for <span className="text-[#0b193c]">Wisdom House's</span> administrative stakeholders.
                                        <span className="block mt-4 text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Powered by Trend Tijarat</span>
                                    </p>
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

            </main>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
                    to { opacity: 1; transform: translateY(0); filter: blur(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}} />
        </div>
    );
};

export default AdminSupport;
