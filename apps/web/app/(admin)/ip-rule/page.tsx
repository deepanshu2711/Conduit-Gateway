"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Ban,
  CheckCircle2,
  Copy,
  Filter,
  Globe,
  Lock,
  MoreHorizontal,
  Network,
  Plus,
  Route as RouteIcon,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";

// --- Types ---
type RuleType = "allow" | "deny";
type RuleScope = "global" | "route" | "consumer";
type RuleStatus = "active" | "inactive";

interface IPRule {
  id: string;
  cidr: string;
  type: RuleType;
  scope: RuleScope;
  target?: string;
  note: string;
  hits: number;
  status: RuleStatus;
  updatedAt: string;
}

// --- Mock Data ---
const MOCK_RULES: IPRule[] = [
  {
    id: "ip_gbl_d1",
    cidr: "185.15.59.224/27",
    type: "deny",
    scope: "global",
    note: "Known malicious botnet subnet",
    hits: 842031,
    status: "active",
    updatedAt: "10m ago",
  },
  {
    id: "ip_gbl_a1",
    cidr: "10.0.0.0/8",
    type: "allow",
    scope: "global",
    note: "Internal VPC traffic",
    hits: 12504930,
    status: "active",
    updatedAt: "1y ago",
  },
  {
    id: "ip_rt_a1",
    cidr: "192.168.1.100/32",
    type: "allow",
    scope: "route",
    target: "/internal/admin",
    note: "Office VPN Gateway",
    hits: 5420,
    status: "active",
    updatedAt: "2w ago",
  },
  {
    id: "ip_csm_d1",
    cidr: "203.0.113.0/24",
    type: "deny",
    scope: "consumer",
    target: "B2B Partner API",
    note: "Compromised partner network",
    hits: 124,
    status: "active",
    updatedAt: "1d ago",
  },
  {
    id: "ip_gbl_d2",
    cidr: "45.22.19.0/24",
    type: "deny",
    scope: "global",
    note: "Scraping origin (Temporarily disabled)",
    hits: 0,
    status: "inactive",
    updatedAt: "3mo ago",
  },
  {
    id: "ip_rt_a2",
    cidr: "2001:db8:85a3::/48",
    type: "allow",
    scope: "route",
    target: "/webhooks/stripe",
    note: "Stripe IPv6 Webhook origins",
    hits: 412,
    status: "active",
    updatedAt: "1w ago",
  },
];

// --- Utility Components ---
const MetricCard = ({
  title,
  value,
  icon: Icon,
  desc,
  descColor = "text-zinc-500",
  highlightClass,
}: any) => (
  <div className="bg-[#0f0f12] border border-white/5 rounded-xl p-5 flex flex-col relative overflow-hidden group">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {title}
      </span>
      <div
        className={`p-1.5 rounded-md bg-[#18181b] border border-white/5 ${highlightClass}`}
      >
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div className="text-2xl font-mono text-white tracking-tight mb-1">
      {value}
    </div>
    <div className={`text-xs ${descColor}`}>{desc}</div>
  </div>
);

const TypeBadge = ({ type }: { type: RuleType }) => {
  const isAllow = type === "allow";
  const Icon = isAllow ? ShieldCheck : ShieldAlert;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-md uppercase tracking-wider border ${
        isAllow
          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
          : "text-red-400 bg-red-500/10 border-red-500/20"
      }`}
    >
      <Icon className="w-3 h-3" />
      {type}
    </span>
  );
};

const ScopeBadge = ({ scope }: { scope: RuleScope }) => {
  const config = {
    global: { icon: Globe, cls: "text-blue-400" },
    route: { icon: RouteIcon, cls: "text-zinc-300" },
    consumer: { icon: User, cls: "text-purple-400" },
  };
  const { icon: Icon, cls } = config[scope];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${cls}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {scope}
    </span>
  );
};

// --- Main Page Component ---
export default function IPRulesPage() {
  const [rules, setRules] = useState<IPRule[]>(MOCK_RULES);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<RuleType | "all">("all");

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      const matchesSearch =
        r.cidr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.note.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [rules, searchQuery, typeFilter]);

  const toggleRuleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status: r.status === "active" ? "inactive" : "active" }
          : r,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30">
      <main className="mx-auto max-w-[1200px] px-6 py-12 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              IP Rules
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Control access to your gateway using IP allowlisting and
              denylisting. Secure internal routes, block malicious subnets, and
              restrict consumer access.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              <Plus className="h-4 w-4" />
              <span>Add IP Rule</span>
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <MetricCard
            title="Total Rules"
            value="156"
            icon={Network}
            desc="142 active rules"
            highlightClass="text-blue-400"
          />
          <MetricCard
            title="Blocked (24h)"
            value="842.1k"
            icon={Ban}
            desc="Connections dropped"
            highlightClass="text-red-400"
            descColor="text-red-400/80"
          />
          <MetricCard
            title="Allowed (24h)"
            value="12.5m"
            icon={CheckCircle2}
            desc="Matched allowlists"
            highlightClass="text-emerald-400"
            descColor="text-emerald-400/80"
          />
          <MetricCard
            title="Blocked Subnets"
            value="18"
            icon={Lock}
            desc="/24 or larger"
            highlightClass="text-zinc-400"
          />
        </motion.div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f0f12] p-2 rounded-xl border border-white/5 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by IP, CIDR, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-[#18181b] border border-white/5 rounded-lg p-1">
              {(["all", "allow", "deny"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                    typeFilter === type
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#18181b] border border-white/5 text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">More Filters</span>
            </button>
          </div>
        </div>

        {/* Rules List */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-[#18181b]/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4 lg:col-span-3">
              IP / CIDR Block
            </div>
            <div className="hidden sm:block col-span-3 lg:col-span-2">
              Type & Scope
            </div>
            <div className="hidden lg:block col-span-4">Note & Target</div>
            <div className="col-span-4 sm:col-span-3 lg:col-span-2 text-right lg:text-left">
              Matches
            </div>
            <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-right">
              Status
            </div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {filteredRules.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-12 text-center flex flex-col items-center justify-center"
                >
                  <Network className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-300 text-sm font-medium">
                    No rules found
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Try adjusting your search or filters.
                  </p>
                </motion.div>
              ) : (
                filteredRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* IP / CIDR */}
                    <div className="col-span-5 sm:col-span-4 lg:col-span-3 flex flex-col min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-mono font-medium truncate ${rule.status === "active" ? "text-white" : "text-zinc-500 line-through"}`}
                        >
                          {rule.cidr}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all focus:opacity-100">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 mt-1 sm:hidden truncate">
                        {rule.note}
                      </span>
                    </div>

                    {/* Type & Scope (Tablet/Desktop) */}
                    <div className="hidden sm:flex col-span-3 lg:col-span-2 flex-col items-start gap-1.5 pr-4">
                      <TypeBadge type={rule.type} />
                      <ScopeBadge scope={rule.scope} />
                    </div>

                    {/* Note & Target (Desktop Only) */}
                    <div className="hidden lg:flex col-span-4 flex-col min-w-0 pr-4 justify-center">
                      <span className="text-sm text-zinc-300 truncate">
                        {rule.note}
                      </span>
                      {rule.target && (
                        <span className="text-xs text-zinc-500 font-mono mt-0.5 truncate flex items-center gap-1">
                          ↳ {rule.target}
                        </span>
                      )}
                    </div>

                    {/* Hits/Matches */}
                    <div className="col-span-4 sm:col-span-3 lg:col-span-2 flex flex-col justify-center text-right lg:text-left">
                      <span
                        className={`font-mono text-sm ${rule.hits > 0 ? "text-zinc-200" : "text-zinc-600"}`}
                      >
                        {rule.hits > 0 ? rule.hits.toLocaleString() : "-"}
                      </span>
                      {rule.hits > 0 && (
                        <span className="text-[10px] text-zinc-500 mt-0.5 truncate">
                          Last hit {rule.updatedAt}
                        </span>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-3 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-4">
                      <button
                        onClick={() => toggleRuleStatus(rule.id)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                          rule.status === "active"
                            ? rule.type === "allow"
                              ? "bg-emerald-500"
                              : "bg-red-500"
                            : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            rule.status === "active"
                              ? "translate-x-3.5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
