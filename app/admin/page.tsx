import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { airlinePrograms, awardCharts, transferPartnerships, regions, creditCardPrograms, airports } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { Plane, Map, Table2, ArrowLeftRight, CreditCard, MapPin } from "lucide-react";
import Link from "next/link";

export default async function AdminPage() {
  const [
    programCount,
    regionCount,
    chartCount,
    transferCount,
    ccCount,
    airportCount,
  ] = await Promise.all([
    db.select({ count: count() }).from(airlinePrograms),
    db.select({ count: count() }).from(regions),
    db.select({ count: count() }).from(awardCharts),
    db.select({ count: count() }).from(transferPartnerships),
    db.select({ count: count() }).from(creditCardPrograms),
    db.select({ count: count() }).from(airports),
  ]);

  const stats = [
    {
      title: "Airline Programs",
      value: programCount[0].count,
      icon: Plane,
      href: "/admin/programs",
    },
    {
      title: "Regions",
      value: regionCount[0].count,
      icon: Map,
      href: "/admin/regions",
    },
    {
      title: "Award Charts",
      value: chartCount[0].count,
      icon: Table2,
      href: "/admin/charts",
    },
    {
      title: "Transfer Partnerships",
      value: transferCount[0].count,
      icon: ArrowLeftRight,
      href: "/admin/transfers",
    },
    {
      title: "Credit Card Programs",
      value: ccCount[0].count,
      icon: CreditCard,
      href: "#",
    },
    {
      title: "Airports",
      value: airportCount[0].count,
      icon: MapPin,
      href: "#",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Manage your award flight data to improve search results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              1. <strong>Airline Programs</strong> - Add or edit loyalty programs
            </p>
            <p className="text-sm text-muted-foreground">
              2. <strong>Regions</strong> - Define geographic zones for each program
            </p>
            <p className="text-sm text-muted-foreground">
              3. <strong>Award Charts</strong> - Set up redemption rates between regions
            </p>
            <p className="text-sm text-muted-foreground">
              4. <strong>Transfer Partners</strong> - Configure credit card transfer partnerships
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
