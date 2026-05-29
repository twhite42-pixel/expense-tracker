import { UserProfile } from "@clerk/nextjs";

export default function SettingsPage() {
  return (
    <div className="flex justify-center">
      <UserProfile />
    </div>
  );
}
