"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Megaphone,
  HelpCircle,
  CalendarDays,
  MapPin,
  Clock,
} from "lucide-react";

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  createdAt: string;
}

interface FaqData {
  id: string;
  question: string;
  answer: string;
  category: string | null;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  imageUrl: string | null;
}

interface CommunityData {
  announcements: AnnouncementData[];
  faqs: FaqData[];
  events: EventData[];
}

export default function CommunityPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<CommunityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;

    async function fetchCommunity() {
      setLoading(true);
      try {
        const res = await fetch("/api/community", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load community data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunity();
  }, [accessToken]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatDateTime = (date: string) =>
    new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Group FAQs by category
  const groupedFaqs = data?.faqs.reduce<Record<string, FaqData[]>>((acc, faq) => {
    const cat = faq.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(faq);
    return acc;
  }, {}) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Community</h1>
        <p className="text-gray-500 mt-1">
          Stay updated with announcements, FAQs, and events
        </p>
      </div>

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements" className="flex items-center gap-2">
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Events
          </TabsTrigger>
        </TabsList>

        {/* Announcements Tab */}
        <TabsContent value="announcements" className="mt-6">
          {data && data.announcements.length > 0 ? (
            <div className="space-y-4">
              {data.announcements.map((a) => (
                <Card key={a.id}>
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {a.imageUrl && (
                        <img
                          src={a.imageUrl}
                          alt={a.title}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {a.title}
                          </h3>
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatDate(a.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-line">
                          {a.body}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Megaphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No announcements yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="mt-6">
          {Object.keys(groupedFaqs).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedFaqs).map(([category, faqs]) => (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="text-base">{category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion className="w-full">
                      {faqs.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left text-sm">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-sm text-gray-600">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No FAQs available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="mt-6">
          {data && data.events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {data.events.map((e) => (
                <Card key={e.id}>
                  {e.imageUrl && (
                    <img
                      src={e.imageUrl}
                      alt={e.title}
                      className="w-full h-40 object-cover rounded-t-lg"
                    />
                  )}
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {e.title}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-500 mb-3">
                      <p className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDateTime(e.eventDate)}
                      </p>
                      {e.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5" />
                          {e.location}
                        </p>
                      )}
                    </div>
                    {e.description && (
                      <p className="text-sm text-gray-600">{e.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No upcoming events</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
