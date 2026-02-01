"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Zap, Loader2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SparkyMessage } from "@/components/sparky";
import { cn } from "@/lib/utils";

// US States list
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
  "New Hampshire", "New Jersey", "New Mexico", "New York",
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
  "West Virginia", "Wisconsin", "Wyoming"
];

export default function ProfileCompletionPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [city, setCity] = useState("");
  const [state, setState] = useState("Texas");
  const [targetExamDate, setTargetExamDate] = useState<Date | undefined>(undefined);
  const [newsletterOptedIn, setNewsletterOptedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Handle redirects in useEffect to avoid setState during render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.profileComplete) {
      router.push("/dashboard");
    }
  }, [status, session?.user?.profileComplete, router]);

  // Show loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  // Show loading while redirecting
  if (status === "unauthenticated" || session?.user?.profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cream to-cream-dark">
        <Loader2 className="h-8 w-8 animate-spin text-amber" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Validation
    if (!dateOfBirth) {
      setFormError("Please enter your date of birth");
      return;
    }

    if (!city.trim()) {
      setFormError("Please enter your city");
      return;
    }

    if (!state) {
      setFormError("Please select your state");
      return;
    }

    if (!targetExamDate) {
      setFormError("Please select your target exam date");
      return;
    }

    // Validate date of birth (must be at least 18 years old)
    const eighteenYearsAgo = new Date();
    eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
    if (dateOfBirth > eighteenYearsAgo) {
      setFormError("You must be at least 18 years old");
      return;
    }

    // Validate target exam date (must be in the future)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetExamDate < today) {
      setFormError("Target exam date must be in the future");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dateOfBirth: dateOfBirth.toISOString(),
          city: city.trim(),
          state,
          targetExamDate: targetExamDate.toISOString(),
          newsletterOptedIn,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Failed to save profile. Please try again.");
        return;
      }

      // Refresh the session to update profileComplete flag in JWT
      await update();

      // Redirect to dashboard on success
      router.push("/dashboard");
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-b from-cream to-cream-dark">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="inline-flex items-center justify-center gap-2">
              <Zap className="h-10 w-10 text-amber" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete Your Profile</CardTitle>
            <p className="text-muted-foreground">
              Just a few more details to personalize your experience
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sparky Welcome Message */}
            <SparkyMessage
              size="small"
              message="Welcome aboard, future Master Electrician! Let me know a bit about you so I can help you prepare for your exam."
            />

            {/* Error Message */}
            {formError && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {formError}
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dateOfBirth"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateOfBirth && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? format(dateOfBirth, "MM/dd/yyyy") : "Select your date of birth"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1920-01-01")
                      }
                      defaultMonth={dateOfBirth || new Date(1990, 0)}
                      captionLayout="dropdown"
                      fromYear={1920}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isLoading}
                  autoComplete="address-level2"
                />
              </div>

              {/* State */}
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Select value={state} onValueChange={setState} disabled={isLoading}>
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Target Exam Date */}
              <div className="space-y-2">
                <Label htmlFor="targetExamDate">Target Exam Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="targetExamDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !targetExamDate && "text-muted-foreground"
                      )}
                      disabled={isLoading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetExamDate
                        ? format(targetExamDate, "MMMM d, yyyy")
                        : "Select your target exam date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={targetExamDate}
                      onSelect={setTargetExamDate}
                      disabled={(date) => date < new Date()}
                      defaultMonth={targetExamDate || new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  We&apos;ll help you create a study plan based on your target date
                </p>
              </div>

              {/* Newsletter Opt-in */}
              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="newsletter"
                  checked={newsletterOptedIn}
                  onCheckedChange={(checked) =>
                    setNewsletterOptedIn(checked === true)
                  }
                  disabled={isLoading}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="newsletter"
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    Subscribe to our newsletter
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get study tips, NEC updates, and exam prep advice
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-amber hover:bg-amber-dark text-white mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Complete Registration"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
