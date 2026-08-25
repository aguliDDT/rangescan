import { Card } from "../components/Card";

export function StagePlaceholder({ title }: { title: string }) {
  return (
    <Card>
      <p className="text-sm text-text-mute">
        <span className="font-semibold text-ink">{title}</span> — not yet built.
      </p>
    </Card>
  );
}
