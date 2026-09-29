import { CheckIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FREE_DAILY_EXTRAS, FREE_DAILY_SEARCHES, PRO_MONTHLY_EUR } from "@/lib/pricing";

function Perks({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <CheckIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The Free and Pro plans. Everything here is the same for every visitor, so
 * the loading view renders it too; only `badge` and `footer` depend on the account.
 */
export function Plans({ badge, footer }: { badge?: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight">Quairy Pro</h1>
        <p className="text-muted-foreground">
          Ask as much as you like, and pick up where you left off.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Free</CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-bold text-foreground">€0</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                `${FREE_DAILY_SEARCHES} searches a day`,
                `${FREE_DAILY_EXTRAS} comparisons or text questions a day`,
                "No account needed",
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-heading text-lg">
              Pro {badge}
            </CardTitle>
            <CardDescription>
              <span className="font-display text-3xl font-bold text-foreground">
                €{PRO_MONTHLY_EUR}
              </span>{" "}
              a month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Perks
              items={[
                "Unlimited searches",
                "Unlimited comparisons and text questions",
                "Search history",
                "Cancel any time",
              ]}
            />
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-2">{footer}</CardFooter>
        </Card>
      </div>
    </div>
  );
}
