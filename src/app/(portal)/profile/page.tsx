"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Pencil,
  AlertTriangle,
  Save,
} from "lucide-react";

interface CustomerProfile {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string;
  altPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  panNumber: string | null;
  aadhaarNumber: string | null;
  profession: string | null;
  companyName: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    email: "",
    phone: "",
    altPhone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    profession: "",
    companyName: "",
  });
  const [changeRequestOpen, setChangeRequestOpen] = useState(false);
  const [changeRequestField, setChangeRequestField] = useState("");
  const [changeRequestReason, setChangeRequestReason] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    fetchProfile();
  }, [accessToken]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditForm({
          email: data.email || "",
          phone: data.phone || "",
          altPhone: data.altPhone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          profession: data.profession || "",
          companyName: data.companyName || "",
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setEditing(false);
        fetchProfile();
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRequestChange() {
    if (!changeRequestReason.trim()) return;
    setSubmittingRequest(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category: "NAME_CHANGE",
          subject: `Request to change ${changeRequestField}`,
          description: changeRequestReason,
        }),
      });
      if (res.ok) {
        setChangeRequestOpen(false);
        setChangeRequestReason("");
        setChangeRequestField("");
      }
    } catch (err) {
      console.error("Failed to create change request:", err);
    } finally {
      setSubmittingRequest(false);
    }
  }

  function openChangeRequest(field: string) {
    setChangeRequestField(field);
    setChangeRequestReason("");
    setChangeRequestOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-500 mt-1">View and manage your personal information</p>
        </div>
        {!editing ? (
          <Button onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Name - sensitive, request change */}
            <div className="space-y-2">
              <Label className="text-gray-500">Full Name</Label>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">
                  {profile.title ? `${profile.title} ` : ""}
                  {profile.name}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-orange-600"
                  onClick={() => openChangeRequest("Name")}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Request Change
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-gray-500">Email</Label>
              {editing ? (
                <Input
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  type="email"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">{profile.email || "Not set"}</p>
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-gray-500">Phone</Label>
              {editing ? (
                <Input
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <p className="text-sm">+91 {profile.phone}</p>
                </div>
              )}
            </div>

            {/* Alt Phone */}
            <div className="space-y-2">
              <Label className="text-gray-500">Alternate Phone</Label>
              {editing ? (
                <Input
                  value={editForm.altPhone}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, altPhone: e.target.value }))
                  }
                  placeholder="Alternate phone number"
                />
              ) : (
                <p className="text-sm">{profile.altPhone || "Not set"}</p>
              )}
            </div>

            {/* Profession */}
            <div className="space-y-2">
              <Label className="text-gray-500">Profession</Label>
              {editing ? (
                <Input
                  value={editForm.profession}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, profession: e.target.value }))
                  }
                  placeholder="Your profession"
                />
              ) : (
                <p className="text-sm">{profile.profession || "Not set"}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label className="text-gray-500">Company</Label>
              {editing ? (
                <Input
                  value={editForm.companyName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, companyName: e.target.value }))
                  }
                  placeholder="Company name"
                />
              ) : (
                <p className="text-sm">{profile.companyName || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-gray-500">Street Address</Label>
              {editing ? (
                <Input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Full address"
                />
              ) : (
                <p className="text-sm">{profile.address || "Not set"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500">City</Label>
              {editing ? (
                <Input
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm">{profile.city || "Not set"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500">State</Label>
              {editing ? (
                <Input
                  value={editForm.state}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, state: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm">{profile.state || "Not set"}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500">Pincode</Label>
              {editing ? (
                <Input
                  value={editForm.pincode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, pincode: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm">{profile.pincode || "Not set"}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitive Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Identity Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-gray-500">PAN Number</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {profile.panNumber || "Not provided"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-orange-600"
                  onClick={() => openChangeRequest("PAN Number")}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Request Change
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-500">Aadhaar Number</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {profile.aadhaarNumber || "Not provided"}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-orange-600"
                  onClick={() => openChangeRequest("Aadhaar Number")}
                >
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Request Change
                </Button>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            For security reasons, identity documents can only be changed through a support ticket
            reviewed by our team.
          </p>
        </CardContent>
      </Card>

      {/* Change Request Dialog */}
      <Dialog open={changeRequestOpen} onOpenChange={setChangeRequestOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Request Change: {changeRequestField}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-sm text-gray-500">
              Changes to {changeRequestField} require verification by our team. Please
              describe the change you need and the reason.
            </p>
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea
                value={changeRequestReason}
                onChange={(e) => setChangeRequestReason(e.target.value)}
                placeholder={`Describe what you want to change your ${changeRequestField} to and why...`}
                rows={4}
              />
            </div>
            <Button
              onClick={handleRequestChange}
              disabled={submittingRequest || !changeRequestReason.trim()}
              className="w-full"
            >
              {submittingRequest ? "Submitting..." : "Submit Change Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
