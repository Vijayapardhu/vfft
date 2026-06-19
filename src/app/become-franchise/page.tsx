"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Shield, CheckCircle, Upload, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useAuth } from "@/hooks/useAuth";
import { apiPost } from "@/services/apiClient";
import { FRANCHISE_BUDGET } from "@/constants/app";
import { ROUTES } from "@/constants/routes";

const STEPS = ["Personal", "Team", "Background", "Payment", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-1 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div
            className={`grid h-7 w-7 place-items-center rounded-full border-2 border-ink text-xs font-bold ${
              i < current ? "bg-vgreen text-ink" : i === current ? "bg-ink text-cream" : "bg-cream text-ink/40"
            }`}
          >
            {i < current ? <CheckCircle className="h-4 w-4" /> : i + 1}
          </div>
          <span className={`hidden sm:block text-xs font-bold uppercase ${i === current ? "text-ink" : "text-ink/40"}`}>
            {label}
          </span>
          {i < STEPS.length - 1 && <div className="h-0.5 w-4 bg-ink/20 mx-1" />}
        </div>
      ))}
    </div>
  );
}

export default function BecomeFranchisePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Step 0 — Personal
  const [fullName, setFullName] = useState("");
  const [ign, setIgn] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");

  // Step 1 — Team
  const [teamName, setTeamName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [shortName, setShortName] = useState("");
  const [teamColor, setTeamColor] = useState("#6366f1");

  // Step 2 — Background
  const [motivation, setMotivation] = useState("");
  const [experience, setExperience] = useState("");
  const [instagram, setInstagram] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerIdea, setBannerIdea] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Step 3 — Payment
  const [screenshotUrl, setScreenshotUrl] = useState("");

  function next() {
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!fullName.trim()) return "Enter your full name.";
      if (!ign.trim()) return "Enter your IGN.";
      if (!phone.trim()) return "Enter your phone number.";
      if (!email.trim()) return "Enter your email.";
      if (!city.trim()) return "Enter your city.";
    }
    if (step === 1) {
      if (!teamName.trim()) return "Enter a team name.";
      if (!slogan.trim()) return "Enter a slogan.";
      if (!shortName.trim()) return "Enter a short name.";
    }
    if (step === 2) {
      if (!motivation.trim()) return "Tell us why you want to own a franchise.";
      if (!agreedTerms) return "You must agree to the terms.";
    }
    if (step === 3) {
      if (!screenshotUrl) return "Upload your payment screenshot.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    next();
  }

  async function handleSubmit() {
    setError(null);
    setBusy(true);
    try {
      await apiPost("/api/franchise/apply", {
        fullName, ign, phone, email, city,
        desiredTeamName: teamName, slogan, shortName, teamColor,
        motivation,
        previousExperience: experience || undefined,
        instagram: instagram || undefined,
        logoUrl: logoUrl || undefined,
        bannerIdea: bannerIdea || undefined,
        screenshotUrl,
        feeAmount: FRANCHISE_BUDGET / 10, // placeholder — reads from settings
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mb-6 grid h-20 w-20 mx-auto place-items-center rounded-full border-4 border-ink bg-vgreen shadow-brutal">
          <CheckCircle className="h-10 w-10" />
        </div>
        <h1 className="text-3xl mb-2">Application Submitted!</h1>
        <p className="font-medium text-ink/60 mb-6">
          We&apos;ll review your application and get back to you via email. This usually takes 1–2 days.
        </p>
        <Button variant="ink" onClick={() => router.push(ROUTES.dashboard)}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="grid h-14 w-14 place-items-center rounded-2xl border-4 border-ink bg-vpurple/30 shadow-brutal-xs">
          <Shield className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-3xl">Become a Franchise Owner</h1>
          <p className="font-medium text-ink/60">Build your legacy. Own a team.</p>
        </div>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-3xl border-4 border-ink bg-cream p-6 shadow-brutal-md">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Personal Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Vijaya Pardhu" />
              </div>
              <div>
                <Label>IGN (In-Game Name) *</Label>
                <Input value={ign} onChange={(e) => setIgn(e.target.value)} placeholder="XxSniperKingxX" />
              </div>
              <div>
                <Label>Phone Number *</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <Label>City / Village *</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Velangi" />
            </div>
          </div>
        )}

        {/* Step 1: Team Info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Team Identity</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Desired Team Name *</Label>
                <Input value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Velangi Warriors" />
              </div>
              <div>
                <Label>Short Name *</Label>
                <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="VWR" maxLength={5} />
              </div>
              <div>
                <Label>Team Color *</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={teamColor}
                    onChange={(e) => setTeamColor(e.target.value)}
                    className="h-11 w-11 cursor-pointer rounded-xl border-2 border-ink"
                  />
                  <Input value={teamColor} onChange={(e) => setTeamColor(e.target.value)} placeholder="#6366f1" />
                </div>
              </div>
              <div className="col-span-2">
                <Label>Team Slogan *</Label>
                <Input value={slogan} onChange={(e) => setSlogan(e.target.value)} placeholder="Born To Dominate" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Background */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Tell Us About Yourself</h2>
            <div>
              <Label>Why do you want to own a franchise? *</Label>
              <textarea
                className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-ink/40"
                rows={4}
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Share your vision for the team and the community..."
              />
            </div>
            <div>
              <Label>Previous Experience (optional)</Label>
              <textarea
                className="min-h-11 w-full rounded-2xl border-4 border-ink bg-cream px-4 py-3 font-medium focus:outline-none focus:ring-2 focus:ring-ink/40"
                rows={3}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Any previous team management, tournament org, etc."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Instagram (optional)</Label>
                <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@yourusername" />
              </div>
              <div>
                <Label>Team Banner Idea (optional)</Label>
                <Input value={bannerIdea} onChange={(e) => setBannerIdea(e.target.value)} placeholder="Describe your banner concept" />
              </div>
            </div>
            <div>
              <Label>Team Logo (optional)</Label>
              <ImageUploader value={logoUrl} onChange={setLogoUrl} folder="teams" />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-ink/30 bg-cream p-3">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer rounded border-2 border-ink"
              />
              <span className="text-sm font-medium">
                I agree that the franchise fee is non-refundable. I understand that the virtual purse (
                {FRANCHISE_BUDGET.toLocaleString()} coins) is for in-app auction use only and has no real monetary value.
              </span>
            </label>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Franchise Fee Payment</h2>
            <div className="rounded-2xl border-4 border-ink bg-vyellow p-4 text-center shadow-brutal">
              <p className="text-xs font-bold uppercase text-ink/60 mb-1">Franchise Fee</p>
              <p className="text-4xl font-bold">₹999</p>
              <p className="text-sm font-medium text-ink/60 mt-1">One-time registration fee</p>
            </div>
            <div className="rounded-2xl border-2 border-ink/30 p-4 text-center">
              <p className="text-sm font-bold uppercase mb-3">Scan QR Code to Pay</p>
              <div className="inline-flex items-center justify-center rounded-2xl border-4 border-ink bg-cream p-4 shadow-brutal-xs">
                <div className="grid h-40 w-40 place-items-center rounded-xl bg-ink/5 text-sm font-medium text-ink/40">
                  QR Code<br />(set by admin)
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-ink/60">
                UPI / PhonePe / GPay · Include your IGN as note
              </p>
            </div>
            <div>
              <Label>Upload Payment Screenshot *</Label>
              <ImageUploader value={screenshotUrl} onChange={setScreenshotUrl} folder="gallery" />
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ["Name", fullName], ["IGN", ign], ["Phone", phone], ["Email", email],
                ["City", city], ["Team Name", teamName], ["Slogan", slogan],
                ["Short Name", shortName],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border-2 border-ink/20 bg-cream p-3">
                  <p className="text-xs font-bold uppercase text-ink/50">{label}</p>
                  <p className="font-bold">{value || "—"}</p>
                </div>
              ))}
              <div className="rounded-xl border-2 border-ink/20 bg-cream p-3 flex items-center gap-2">
                <p className="text-xs font-bold uppercase text-ink/50">Team Color</p>
                <span className="ml-auto h-6 w-6 rounded-full border-2 border-ink" style={{ background: teamColor }} />
              </div>
              {logoUrl && (
                <div className="col-span-2 rounded-xl border-2 border-ink/20 bg-cream p-3">
                  <p className="text-xs font-bold uppercase text-ink/50 mb-2">Logo</p>
                  <Image src={logoUrl} alt="Logo" width={64} height={64} className="rounded-xl border-2 border-ink object-cover" />
                </div>
              )}
            </div>
            {!isAuthenticated && (
              <div className="rounded-2xl border-4 border-vred bg-vred/10 p-3 text-sm font-bold text-vred">
                You must be signed in to submit.
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border-2 border-vred bg-vred/10 px-3 py-2 text-sm font-bold text-vred">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-between gap-3">
          {step > 0 ? (
            <Button variant="cream" onClick={back} disabled={busy}>← Back</Button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <Button variant="ink" onClick={handleNext}>Continue →</Button>
          ) : (
            <Button
              variant="yellow"
              size="lg"
              disabled={busy || !isAuthenticated || isLoading}
              onClick={handleSubmit}
            >
              {busy ? "Submitting…" : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
