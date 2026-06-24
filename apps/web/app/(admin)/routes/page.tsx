"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Blocks,
  ChevronDown,
  Copy,
  Filter,
  Globe,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Zap,
} from "lucide-react";

// --- Types ---
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "ALL";
type RouteStatus = "active" | "inactive" | "draft";

interface Plugin {
  name: string;
  type: "auth" | "security" | "traffic";
}

interface Route {
  id: string;
  name: string;
  prefix: string;
  methods: HttpMethod[];
  target: string;
  status: RouteStatus;
  plugins: Plugin[];
  updatedAt: string;
}

// --- Mock Data ---
const MOCK_ROUTES: Route[] = [
  {
    id: "rt_prod_1a",
    name: "Core API v1",
    prefix: "/api/v1/*",
    methods: ["ALL"],
    target: "https://api-core.internal:8000",
    status: "active",
    plugins: [
      { name: "JWT Auth", type: "auth" },
      { name: "Rate Limit", type: "traffic" },
    ],
    updatedAt: "2m ago",
  },
  {
    id: "rt_auth_2b",
    name: "Authentication",
    prefix: "/auth/login",
    methods: ["POST"],
    target: "https://auth.internal:8001",
    status: "active",
    plugins: [{ name: "CORS", type: "security" }],
    updatedAt: "1h ago",
  },
  {
    id: "rt_bill_3c",
    name: "Billing Webhooks",
    prefix: "/webhooks/stripe",
    methods: ["POST"],
    target: "https://billing.internal:8002",
    status: "active",
    plugins: [{ name: "IP Restrict", type: "security" }],
    updatedAt: "3d ago",
  },
  {
    id: "rt_srch_4d",
    name: "Search Index",
    prefix: "/search",
    methods: ["GET", "POST"],
    target: "https://search.internal:8003",
    status: "active",
    plugins: [{ name: "Cache", type: "traffic" }],
    updatedAt: "1w ago",
  },
  {
    id: "rt_lgcy_5e",
    name: "Legacy Users API",
    prefix: "/api/v0/users",
    methods: ["GET"],
    target: "https://legacy.internal:7000",
    status: "inactive",
    plugins: [],
    updatedAt: "2w ago",
  },
  {
    id: "rt_tst_6f",
    name: "Beta Features",
    prefix: "/beta/*",
    methods: ["ALL"],
    target: "https://beta-staging.internal:8080",
    status: "draft",
    plugins: [{ name: "Basic Auth", type: "auth" }],
    updatedAt: "1mo ago",
  },
];

// --- Utility Components ---
const Badge = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={`px-2 py-0.5 text-[10px] font-medium rounded-md font-mono tracking-wide ${className}`}
  >
    {children}
  </span>
);

const MethodBadge = ({ method }: { method: HttpMethod }) => {
  const styles: Record<HttpMethod, string> = {
    GET: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    POST: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    PUT: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    PATCH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    DELETE: "text-red-400 bg-red-500/10 border-red-500/20",
    ALL: "text-zinc-300 bg-zinc-500/10 border-zinc-500/20",
  };
  return <Badge className={`border ${styles[method]}`}>{method}</Badge>;
};

// --- Main Page Component ---
export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>(MOCK_ROUTES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RouteStatus | "all">("all");

  const filteredRoutes = useMemo(() => {
    return routes.filter((route) => {
      const matchesSearch =
        route.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        route.prefix.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || route.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routes, searchQuery, statusFilter]);

  const toggleRouteStatus = (id: string) => {
    setRoutes((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = r.status === "active" ? "inactive" : "active";
          return { ...r, status: newStatus };
        }
        return r;
      }),
    );
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-blue-500/30">
      <main className="mx-auto max-w-[1200px] px-6 py-12 space-y-8">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              Routes
            </h1>
            <p className="text-zinc-400 text-sm max-w-xl">
              Configure how incoming requests are matched and routed to your
              upstream services. Attach plugins to handle authentication,
              transformation, and traffic control.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-white text-zinc-900 hover:bg-zinc-200 transition-colors shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)]">
              <Plus className="h-4 w-4" />
              <span>Create Route</span>
            </button>
          </div>
        </header>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#0f0f12] p-2 rounded-xl border border-white/5 shadow-sm">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search routes by name or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-[#18181b] border border-white/5 rounded-lg p-1">
              {(["all", "active", "inactive", "draft"] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                      statusFilter === status
                        ? "bg-white/10 text-white shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {status}
                  </button>
                ),
              )}
            </div>
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-[#18181b] border border-white/5 text-zinc-300 hover:text-white hover:bg-white/5 transition-all">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Route List */}
        <div className="bg-[#0f0f12] border border-white/5 rounded-xl shadow-xl overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 bg-[#18181b]/50 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-5 sm:col-span-4 lg:col-span-3">Route</div>
            <div className="col-span-4 sm:col-span-4 lg:col-span-3">
              Path & Methods
            </div>
            <div className="hidden lg:block col-span-3">Upstream Target</div>
            <div className="hidden sm:block col-span-2 lg:col-span-2">
              Plugins
            </div>
            <div className="col-span-3 sm:col-span-2 lg:col-span-1 text-right">
              Status
            </div>
          </div>

          {/* List Body */}
          <div className="divide-y divide-white/5">
            <AnimatePresence initial={false}>
              {filteredRoutes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-12 text-center flex flex-col items-center justify-center"
                >
                  <Globe className="h-10 w-10 text-zinc-700 mb-3" />
                  <p className="text-zinc-300 text-sm font-medium">
                    No routes found
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    Try adjusting your search or filters.
                  </p>
                </motion.div>
              ) : (
                filteredRoutes.map((route, index) => (
                  <motion.div
                    key={route.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Route Info */}
                    <div className="col-span-5 sm:col-span-4 lg:col-span-3 flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-medium text-white truncate">
                        {route.name}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono mt-0.5 truncate">
                        {route.id}
                      </span>
                    </div>

                    {/* Path & Methods */}
                    <div className="col-span-4 sm:col-span-4 lg:col-span-3 flex flex-col items-start gap-2 min-w-0 pr-4">
                      <div className="flex items-center gap-1.5 max-w-full">
                        <span className="font-mono text-xs text-zinc-300 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded truncate">
                          {route.prefix}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-white transition-all">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {route.methods.map((m) => (
                          <MethodBadge key={m} method={m} />
                        ))}
                      </div>
                    </div>

                    {/* Target (Desktop Only) */}
                    <div className="hidden lg:flex col-span-3 items-center gap-2 text-zinc-400 min-w-0 pr-4">
                      <ArrowRight className="h-4 w-4 text-zinc-600 shrink-0" />
                      <span className="font-mono text-xs truncate group-hover:text-zinc-300 transition-colors">
                        {route.target}
                      </span>
                    </div>

                    {/* Plugins */}
                    <div className="hidden sm:flex col-span-2 lg:col-span-2 items-center gap-2">
                      {route.plugins.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <Blocks className="h-4 w-4 text-zinc-500" />
                          <span className="text-xs text-zinc-400">
                            {route.plugins.length} active
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-600 italic">
                          None
                        </span>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-3 sm:col-span-2 lg:col-span-1 flex items-center justify-end gap-4">
                      {route.status === "draft" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                          Draft
                        </span>
                      ) : (
                        <button
                          onClick={() => toggleRouteStatus(route.id)}
                          className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                            route.status === "active"
                              ? "bg-emerald-500"
                              : "bg-zinc-700"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              route.status === "active"
                                ? "translate-x-3.5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      )}

                      <button className="text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {/* Footer Pagination Mock */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#18181b]/30 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              Showing {filteredRoutes.length} of {routes.length} routes
            </span>
            <div className="flex gap-1">
              <button
                disabled
                className="px-2 py-1 text-xs text-zinc-600 font-medium rounded hover:bg-white/5 disabled:opacity-50"
              >
                Prev
              </button>
              <button className="px-2 py-1 text-xs text-white font-medium rounded bg-white/10">
                1
              </button>
              <button className="px-2 py-1 text-xs text-zinc-400 font-medium rounded hover:bg-white/5 hover:text-white">
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
