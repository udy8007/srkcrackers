import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    days.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const rangeStart = new Date(days[0].date);

  const [totalVisits, todayVisits, recentVisits, cityGroups, visitsInRange] = await Promise.all([
    prisma.siteVisit.count(),
    prisma.siteVisit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.siteVisit.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        path: true,
        city: true,
        region: true,
        country: true,
        createdAt: true,
      },
    }),
    prisma.siteVisit.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: { _all: true },
    }),
    prisma.siteVisit.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
    }),
  ]);

  for (const v of visitsInRange) {
    const key = v.createdAt.toISOString().slice(0, 10);
    const bucket = days.find((d) => d.date === key);
    if (bucket) bucket.count++;
  }

  const topCities = cityGroups
    .filter((g) => g.city)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10)
    .map((g) => ({
      city: g.city as string,
      count: g._count._all,
    }));

  return NextResponse.json({
    totalVisits,
    todayVisits,
    topCities,
    recentVisits,
    dailyVisits: days,
  });
}
