"use client";

import { useState, useTransition } from "react";
import { KeyRound, Save, User } from "lucide-react";

import { ActivityTimeline } from "@/components/activity/ActivityTimeline";
import { StaffAvatar } from "@/components/staff/StaffAvatar";
import type { AvatarFieldState } from "@/components/staff/StaffAvatarField";
import { StaffAvatarField } from "@/components/staff/StaffAvatarField";
import { StaffRoleBadge } from "@/components/staff/StaffRoleBadge";
import { StaffStatusBadge } from "@/components/staff/StaffStatusBadge";
import { PageContainer } from "@/components/shared/PageContainer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  changeOwnPasswordAction,
  removeOwnAvatarAction,
  updateOwnProfileAction,
  uploadOwnAvatarAction,
} from "@/features/profile/actions";
import { useToast } from "@/hooks/use-toast";
import { formatRoleLabel } from "@/lib/auth/current-user-display";
import { formatUserStatusLabel } from "@/lib/labels/humanize";
import type { ActivityLog } from "@/types/log";
import type { UserProfile } from "@/types/profile";

type Tab = "personal" | "security" | "account";

type Props = {
  profile: UserProfile;
  activity: ActivityLog[];
};

export function ProfilePageContent({ profile: initial, activity }: Props) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("personal");
  const [profile, setProfile] = useState(initial);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone === "—" ? "" : profile.phone);
  const [address, setAddress] = useState(profile.address);
  const [emergencyContact, setEmergencyContact] = useState(profile.emergencyContact);
  const [nextOfKin, setNextOfKin] = useState(profile.nextOfKin);
  const [nationality, setNationality] = useState(profile.nationality);
  const [idNumber, setIdNumber] = useState(profile.idNumber);
  const [avatar, setAvatar] = useState<AvatarFieldState>({
    file: null,
    removeExisting: false,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function savePersonal() {
    setError("");
    startTransition(async () => {
      const result = await updateOwnProfileAction({
        fullName,
        email,
        phone,
        address,
        emergencyContact,
        nextOfKin,
        nationality,
        idNumber,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }

      if (avatar.file) {
        const formData = new FormData();
        formData.set("avatar", avatar.file);
        const upload = await uploadOwnAvatarAction(formData);
        if (!upload.success) {
          setError(upload.error);
          toast.error(upload.error);
          return;
        }
        if (upload.profile) setProfile(upload.profile);
      } else if (avatar.removeExisting) {
        const removed = await removeOwnAvatarAction();
        if (!removed.success) {
          setError(removed.error);
          toast.error(removed.error);
          return;
        }
        if (removed.profile) setProfile(removed.profile);
      } else if (result.profile) {
        setProfile(result.profile);
      }

      setAvatar({ file: null, removeExisting: false });
      toast.celebrate("Profile Updated", "Your profile has been saved.");
    });
  }

  function savePassword() {
    setError("");
    startTransition(async () => {
      const result = await changeOwnPasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.celebrate("Password Changed", "Your password has been updated.");
    });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "personal", label: "Personal Information" },
    { id: "security", label: "Security" },
    { id: "account", label: "Account" },
  ];

  return (
    <PageContainer
      title="My Profile"
      description="Manage your personal information, security, and account details."
    >
      {error ? (
        <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {tab === "personal" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StaffAvatarField
                  fullName={fullName}
                  currentAvatarUrl={profile.avatarUrl}
                  value={avatar}
                  onChange={setAvatar}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Full Name</Label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Next of Kin</Label>
                    <Input value={nextOfKin} onChange={(e) => setNextOfKin(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ID Number</Label>
                    <Input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} />
                  </div>
                </div>
                <Button onClick={savePersonal} disabled={isPending}>
                  <Save className="h-4 w-4" />
                  {isPending ? "Saving…" : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {tab === "security" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <KeyRound className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button onClick={savePassword} disabled={isPending}>
                  {isPending ? "Updating…" : "Update Password"}
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {tab === "account" ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Employment details are managed by your administrator.
                </p>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-center gap-4">
                  <StaffAvatar
                    fullName={profile.fullName}
                    avatarUrl={profile.avatarUrl}
                    className="h-14 w-14"
                  />
                  <div>
                    <p className="font-semibold text-lg">{profile.fullName}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <StaffRoleBadge role={profile.role} />
                      <StaffStatusBadge status={profile.status} />
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Employee ID</p>
                    <p className="font-mono font-medium">{profile.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p className="font-medium">{profile.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium">{formatRoleLabel(profile.role)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date Joined</p>
                    <p className="font-medium">{profile.dateJoined}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium">{formatUserStatusLabel(profile.status)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Login</p>
                    <p className="font-medium">{profile.lastLogin}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <ActivityTimeline activity={activity} />
      </div>
    </PageContainer>
  );
}
