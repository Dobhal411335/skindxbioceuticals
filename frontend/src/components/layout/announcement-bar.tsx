import { announcement } from "@/data/landing";

export function AnnouncementBar() {
  return (
    <div className="bg-secondary text-secondary-foreground">
      <p className="container-page py-2 text-center text-xs tracking-wide sm:text-sm">
        {announcement}
      </p>
    </div>
  );
}
