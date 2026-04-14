"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Gift,
  Copy,
  Share2,
  Users,
  Eye,
  Home,
  IndianRupee,
  Award,
  Star,
  Plus,
} from "lucide-react";

interface ReferralData {
  id: string;
  refereeName: string;
  refereePhone: string;
  status: string;
  rewardAmount: number | null;
  createdAt: string;
}

interface ReferralSummary {
  referralCode: string;
  totalReferrals: number;
  siteVisits: number;
  bookings: number;
  totalRewards: number;
  referrals: ReferralData[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  LEAD: { label: "Lead", variant: "secondary" },
  SITE_VISIT: { label: "Site Visit", variant: "outline" },
  BOOKING: { label: "Booking", variant: "default" },
  REWARD_PENDING: { label: "Reward Pending", variant: "outline" },
  REWARD_PAID: { label: "Reward Paid", variant: "default" },
};

export default function ReferralsPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchReferrals() {
      setLoading(true);
      try {
        const res = await fetch("/api/referrals", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load referrals:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [accessToken]);

  const copyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareLink = () => {
    const link = `${window.location.origin}/refer?code=${data?.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitReferral = async () => {
    if (!newName || !newPhone || !accessToken) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refereeName: newName, refereePhone: newPhone }),
      });
      if (res.ok) {
        // Refresh data
        const refreshRes = await fetch("/api/referrals", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (refreshRes.ok) {
          setData(await refreshRes.json());
        }
        setNewName("");
        setNewPhone("");
        setDialogOpen(false);
      }
    } catch (err) {
      console.error("Failed to create referral:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // Milestone badges
  const milestones = [
    { label: "First Referral", icon: Star, threshold: 1, color: "text-yellow-600 bg-yellow-50" },
    { label: "5 Referrals", icon: Award, threshold: 5, color: "text-purple-600 bg-purple-50" },
    { label: "10 Referrals", icon: Gift, threshold: 10, color: "text-blue-600 bg-blue-50" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
          <p className="text-gray-500 mt-1">Refer friends and earn rewards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Referral
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Referral</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="refName">Name</Label>
                <Input
                  id="refName"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Friend's name"
                />
              </div>
              <div>
                <Label htmlFor="refPhone">Phone</Label>
                <Input
                  id="refPhone"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="Phone number"
                />
              </div>
              <Button
                onClick={handleSubmitReferral}
                disabled={submitting || !newName || !newPhone}
                className="w-full"
              >
                {submitting ? "Submitting..." : "Submit Referral"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Referral Code */}
      {data && (
        <Card className="border-2 border-dashed border-blue-200 bg-blue-50/50">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-600 mb-1">Your Referral Code</p>
                <p className="text-3xl font-bold tracking-wider text-blue-700">
                  {data.referralCode}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={copyCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  {copied ? "Copied!" : "Copy Code"}
                </Button>
                <Button variant="outline" onClick={shareLink}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Referrals
              </CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{data.totalReferrals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Site Visits
              </CardTitle>
              <Eye className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{data.siteVisits}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Bookings
              </CardTitle>
              <Home className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{data.bookings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                Rewards Earned
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(data.totalRewards)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Milestone Badges */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              {milestones.map((m) => {
                const achieved = data.totalReferrals >= m.threshold;
                return (
                  <div
                    key={m.label}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      achieved ? m.color + " border-current" : "bg-gray-50 text-gray-300 border-gray-200"
                    }`}
                  >
                    <m.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{m.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referrals Table */}
      {data && data.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.referrals.map((r) => {
                  const config = statusConfig[r.status];
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.refereeName}</TableCell>
                      <TableCell>{r.refereePhone}</TableCell>
                      <TableCell>
                        <Badge variant={config?.variant || "secondary"}>
                          {config?.label || r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {r.rewardAmount ? formatCurrency(r.rewardAmount) : "-"}
                      </TableCell>
                      <TableCell>{formatDate(r.createdAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data && data.referrals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Gift className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No referrals yet</p>
            <p className="mt-1">Share your referral code with friends to get started!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
