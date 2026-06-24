"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Ban,
  Clock,
  Copy,
  Database,
  Filter,
  Globe,
  MoreHorizontal,
  Plus,
  Route as RouteIcon,
  Search,
  Shield,
  User,
} from "lucide-react";

// --- Types ---
type PolicyScope = "global" | "route" | "consumer";
type PolicyStatus = "active" | "inactive";

interface RateLimitConfig {
  requests: number;
  window: string; // e.g., "1m", "1h", "1s"
  identifier: "ip" | "credential" | "header";
}

interface RateLimitPolicy {
  id: string;
  name: string;
  scope: PolicyScope;
  target?: string; // e.g., "/api/v1/*" or "csm_123"
  config: RateLimitConfig;
  status: PolicyStatus;
  throttled24h: number;
  utilizationPct: number; // 0-100
  updatedAt: string;
}

// --- Mock Data ---
const MOCK_POLICIES: RateLimitPolicy[] = [
  {
    id: "rlp_gbl_01",
    name: "Global DDoS Protection",
    scope: "global",
    config: { requests: 10000, window: "1m", identifier: "ip" },
    status: "active",
    throttled24h: 142030,
    utilizationPct: 85,
    updatedAt: "2h ago",
  },
  {
    id: "rlp_csm_free",
    name: "Free Tier Consumer Limit",
    scope: "consumer",
    target: "Free Tier Group",
    config: { requests: 100, window: "1h", identifier: "credential" },
    status: "active",
    throttled24h: 5204,
    utilizationPct: 92,
    updatedAt: "1d ago",
  },
  {
    id: "rlp_csm_pro",
    name: "Pro Tier Consumer Limit",
    scope: "consumer",
    target: "Pro Tier Group",
    config: { requests: 5000, window: "1h", identifier: "credential" },
    status: "active",
    throttled24h: 12,
    utilizationPct: 15,
    updatedAt: "1d ago",
  },
  {
    id: "rlp_rt_auth",
    name: "Brute Force Prevention",
    scope: "route",
    target: "/auth/login",
    config: { requests: 5, window: "1m", identifier: "ip" },
    status: "active",
    throttled24h: 843,
    utilizationPct: 45,
    updatedAt: "3w ago",
  },
  {
    id: "rlp_rt_heavy",
    name: "Expensive Reports API",
    scope: "route",
    target: "/api/v1/reports/export",
    config: { requests: 2, window: "1m", identifier: "credential" },
    status: "inactive",
    throttled24h: 0,
    utilizationPct: 0,
    updatedAt: "2mo ago",
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

const ScopeBadge = ({ scope }: { scope: PolicyScope }) => {
  const config = {
    global: {
      icon: Globe,
      cls: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    },
    route: {
      icon: RouteIcon,
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    consumer: {
      icon: User,
      cls: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    },
  };
  const { icon: Icon, cls } = config[scope];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-md uppercase tracking-wider border ${cls}`}
    >
      <Icon className="w-3 h-3" />
      {scope}
    </span>
  );
};

// --- Main Page Component ---
export default function RateLimitsPage() {
  const [policies, setPolicies] = useState<RateLimitPolicy[]>(MOCK_POLICIES);
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState<PolicyScope | "all">("all");

  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.target &&
          p.target.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesScope = scopeFilter === "all" || p.scope === scopeFilter;
      return matchesSearch && matchesScope;
    });
  }, [policies, searchQuery, scopeFilter]);

  const togglePolicyStatus = (id: string) => {
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, status: p.status === "active" ? "inactive" : "active" }
          : p,
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
              Rate Limits
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Protect your upstream services from abuse and manage traffic
              tiers. Configure limits globally, per route, or per specific
              consumer.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              <Plus className="h-4 w-4" />
              <span>Create Policy</span>
            </button>
          </div>
        </header>

        {/* Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <MetricCard
            title="Total Policies"
            value="24"
            icon={Database}
            desc="4 currently inactive"
            highlightClass="text-zinc-400"
          />
          <MetricCard
            title="Throttled (24h)"
            value="148,089"
            icon={Ban}
            desc="Total blocked requests"
            highlightClass="text-red-400"
            descColor="text-red-400/80"
          />
          <MetricCard
            title="Highest Utilization"
            value="92%"
            icon={Activity}
            desc="Free Tier Consumer Limit"
            highlightClass="text-amber-400"
            descColor="text-amber-400/80"
          />
        </motion.div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f0f12] p-2 rounded-xl border border-white/5 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search policies or targets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-[#18181b] border border-white/5 rounded-lg p-1">
              {(["all", "global", "route", "consumer"] as const).map(
                (scope) => (
                  <button
                    key={scope}
                    onClick={() => setScopeFilter(scope)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                      scopeFilter === scope
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {scope}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Policies List */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-[#18181b]/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4 lg:col-span-3">
              Policy & Scope
            </div>
            <div className="hidden lg:block col-span-3">Configuration</div>
            <div className="hidden sm:block col-span-4 lg:col-span-3">
              Utilization Tracker
            </div>
            <div className="col-span-4 sm:col-span-2 lg:col-span-2 text-right lg:text-left">
              Throttled (24h)
            </div>
            <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-right">
              Status
            </div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {filteredPolicies.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-12 text-center flex flex-col items-center justify-center"
                >
                  <Shield className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-300 text-sm font-medium">
                    No policies found
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Try adjusting your search or filters.
                  </p>
                </motion.div>
              ) : (
                filteredPolicies.map((policy, index) => (
                  <motion.div
                    key={policy.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Policy & Scope */}
                    <div className="col-span-5 sm:col-span-4 lg:col-span-3 flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-medium text-white truncate">
                        {policy.name}
                      </span>
                      <div className="flex items-center gap-2 mt-1.5">
                        <ScopeBadge scope={policy.scope} />
                        {policy.target && (
                          <span
                            className="text-xs text-zinc-500 font-mono truncate max-w-[120px]"
                            title={policy.target}
                          >
                            {policy.target}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Configuration (Desktop Only) */}
                    <div className="hidden lg:flex col-span-3 items-center gap-2 min-w-0 pr-4">
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-sm text-zinc-200">
                          {policy.config.requests.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-500">req</span>
                        <span className="text-zinc-600 mx-1">/</span>
                        <span className="font-mono text-sm text-blue-400">
                          {policy.config.window}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-[#18181b] border border-white/5 text-[10px] text-zinc-500 ml-2 uppercase">
                        by {policy.config.identifier}
                      </span>
                    </div>

                    {/* Utilization Tracker */}
                    <div className="hidden sm:flex col-span-4 lg:col-span-3 flex-col justify-center pr-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                          Load
                        </span>
                        <span
                          className={`text-[10px] font-mono ${policy.utilizationPct > 80 ? "text-amber-400" : "text-zinc-400"}`}
                        >
                          {policy.utilizationPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden border border-white/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${policy.utilizationPct}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            policy.utilizationPct > 85
                              ? "bg-red-500"
                              : policy.utilizationPct > 60
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Throttled Count */}
                    <div className="col-span-4 sm:col-span-2 lg:col-span-2 flex flex-col justify-center text-right lg:text-left">
                      <span
                        className={`font-mono text-sm ${policy.throttled24h > 0 ? "text-zinc-200" : "text-zinc-600"}`}
                      >
                        {policy.throttled24h > 0
                          ? policy.throttled24h.toLocaleString()
                          : "-"}
                      </span>
                      {policy.throttled24h > 0 &&
                        policy.status === "active" && (
                          <span className="text-[10px] text-red-400 flex items-center justify-end lg:justify-start gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Active blocks
                          </span>
                        )}
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-3 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-4">
                      <button
                        onClick={() => togglePolicyStatus(policy.id)}
                        className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                          policy.status === "active"
                            ? "bg-emerald-500"
                            : "bg-zinc-700"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            policy.status === "active"
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
