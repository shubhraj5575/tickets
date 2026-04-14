"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Landmark,
  Phone,
  Mail,
  User,
  IndianRupee,
  Percent,
  FileText,
  Calculator,
  CheckCircle2,
} from "lucide-react";

interface BankData {
  id: string;
  bankName: string;
  interestRate: number;
  maxLoanAmount: number | null;
  processingFee: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  documentChecklist: string[];
}

interface LoansData {
  banks: BankData[];
}

function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || annualRate <= 0 || tenureMonths <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

export default function LoansPage() {
  const { accessToken } = useAuth();
  const [data, setData] = useState<LoansData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loanAmount, setLoanAmount] = useState<string>("5000000");
  const [tenure, setTenure] = useState<string>("240");

  useEffect(() => {
    if (!accessToken) return;

    async function fetchBanks() {
      setLoading(true);
      try {
        const res = await fetch("/api/loans", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanks();
  }, [accessToken]);

  const emiResults = useMemo(() => {
    if (!data) return [];
    const principal = Number(loanAmount) || 0;
    const months = Number(tenure) || 0;
    return data.banks.map((bank) => ({
      bankName: bank.bankName,
      rate: bank.interestRate,
      emi: calculateEMI(principal, bank.interestRate, months),
      totalPayable: calculateEMI(principal, bank.interestRate, months) * months,
      totalInterest: calculateEMI(principal, bank.interestRate, months) * months - principal,
    }));
  }, [data, loanAmount, tenure]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

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
        <h1 className="text-2xl font-bold text-gray-900">Loan Assistance</h1>
        <p className="text-gray-500 mt-1">
          Compare partner bank offers and calculate your EMI
        </p>
      </div>

      {/* EMI Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            EMI Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <div>
              <Label htmlFor="loanAmount">Loan Amount (INR)</Label>
              <Input
                id="loanAmount"
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="e.g. 5000000"
              />
            </div>
            <div>
              <Label htmlFor="tenure">Tenure (months)</Label>
              <Input
                id="tenure"
                type="number"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                placeholder="e.g. 240"
              />
            </div>
          </div>

          {emiResults.length > 0 && Number(loanAmount) > 0 && Number(tenure) > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {emiResults.map((result) => (
                <div
                  key={result.bankName}
                  className="p-4 rounded-lg border bg-gray-50"
                >
                  <p className="font-semibold text-gray-900">{result.bankName}</p>
                  <p className="text-xs text-gray-500 mb-2">
                    @ {result.rate}% p.a.
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {formatCurrency(result.emi)}
                    <span className="text-xs font-normal text-gray-500">/mo</span>
                  </p>
                  <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                    <p>Total Payable: {formatCurrency(result.totalPayable)}</p>
                    <p>Total Interest: {formatCurrency(result.totalInterest)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Banks */}
      {data && data.banks.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.banks.map((bank) => (
            <Card key={bank.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-blue-600" />
                  {bank.bankName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-500">Interest Rate</p>
                      <p className="font-semibold">{bank.interestRate}% p.a.</p>
                    </div>
                  </div>
                  {bank.maxLoanAmount && (
                    <div className="flex items-center gap-2 text-sm">
                      <IndianRupee className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Max Loan</p>
                        <p className="font-semibold">
                          {formatCurrency(bank.maxLoanAmount)}
                        </p>
                      </div>
                    </div>
                  )}
                  {bank.processingFee && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-gray-500">Processing Fee</p>
                        <p className="font-semibold">{bank.processingFee}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact */}
                {(bank.contactPerson || bank.contactPhone) && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Contact Details</p>
                      <div className="space-y-1 text-sm text-gray-600">
                        {bank.contactPerson && (
                          <p className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5" />
                            {bank.contactPerson}
                          </p>
                        )}
                        {bank.contactPhone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5" />
                            {bank.contactPhone}
                          </p>
                        )}
                        {bank.contactEmail && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5" />
                            {bank.contactEmail}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Document Checklist */}
                {bank.documentChecklist.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Document Checklist
                      </p>
                      <ul className="space-y-1">
                        {bank.documentChecklist.map((doc, i) => (
                          <li
                            key={i}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {data && data.banks.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Landmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No partner banks available</p>
            <p className="mt-1">Partner bank details will appear here once added.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
