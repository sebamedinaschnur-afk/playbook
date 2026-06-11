import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Wordmark } from "@/components/Wordmark";

// Email verification landing (spec §2.1). Consumes the token from the link.
export default async function VerifyPage(props: PageProps<"/verify">) {
  const { token } = await props.searchParams;

  let status: "ok" | "invalid" = "invalid";

  if (typeof token === "string" && token.length > 0) {
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (record && record.expires > new Date()) {
      await prisma.$transaction([
        prisma.user.update({
          where: { email: record.identifier },
          data: { emailVerified: new Date() },
        }),
        // Invalidate this and any other outstanding tokens for the email.
        prisma.verificationToken.deleteMany({ where: { identifier: record.identifier } }),
      ]);
      status = "ok";
    }
  }

  if (status === "ok") {
    redirect("/login?verified=1");
  }

  return (
    <>
      <div className="mb-6">
        <Wordmark />
      </div>
      <div className="rounded-2xl border border-line bg-panel p-5 text-center">
        <p className="text-sm text-red">This verification link is invalid or has expired.</p>
        <Link href="/login" className="mt-4 block text-sm text-green">
          Back to log in
        </Link>
      </div>
    </>
  );
}
