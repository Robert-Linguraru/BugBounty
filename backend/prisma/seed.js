import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean existing records (in reverse order of dependencies)
  await prisma.comment?.deleteMany().catch(() => {});
  await prisma.attachment?.deleteMany().catch(() => {});
  await prisma.report?.deleteMany().catch(() => {});
  await prisma.user?.deleteMany().catch(() => {});

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('AdminSecurePass123!', saltRounds);
  const researcherPasswordHash = await bcrypt.hash('ResearcherPass123!', saltRounds);

  // 1. Create Admins (2 records)
  const admin1 = await prisma.user.create({
    data: {
      email: 'admin.alpha@bugbounty.local',
      username: 'admin_alpha',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin.beta@bugbounty.local',
      username: 'admin_beta',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });

  // 2. Create Researchers (2 records)
  const researcher1 = await prisma.user.create({
    data: {
      email: 'alice.hacker@bugbounty.local',
      username: 'alice_sec',
      passwordHash: researcherPasswordHash,
      role: 'RESEARCHER',
    },
  });

  const researcher2 = await prisma.user.create({
    data: {
      email: 'bob.hunter@bugbounty.local',
      username: 'bob_bounty',
      passwordHash: researcherPasswordHash,
      role: 'RESEARCHER',
    },
  });

  console.log('  Created 2 Admins and 2 Researchers');

  // 3. Create Reports (8 records)
  const reportsData = [
    {
      title: 'SQL Injection in /api/v1/users',
      targetSystem: 'api.fintech.local',
      severity: 'CRITICAL',
      status: 'TRIAGED',
      bountyAmount: 2500.00,
      details: 'Unsanitized input in user filter query parameter allows full database dump.',
      isDisclosed: false,
      userId: researcher1.id,
    },
    {
      title: 'Stored XSS in User Profile Comments',
      targetSystem: 'shop.ecommerce.local',
      severity: 'HIGH',
      status: 'PENDING',
      bountyAmount: 1000.00,
      details: 'Comment input field lacks proper HTML escaping, executing payload on view.',
      isDisclosed: false,
      userId: researcher1.id,
    },
    {
      title: 'IDOR in Password Reset Token Generation',
      targetSystem: 'auth.fintech.local',
      severity: 'HIGH',
      status: 'RESOLVED',
      bountyAmount: 1500.00,
      details: 'Sequential integers used for password reset tokens, allowing account takeover.',
      isDisclosed: true,
      userId: researcher2.id,
    },
    {
      title: 'CORS Misconfiguration on Health API',
      targetSystem: 'api.health.local',
      severity: 'MEDIUM',
      status: 'PENDING',
      bountyAmount: 500.00,
      details: 'Access-Control-Allow-Origin header reflects untrusted request origins.',
      isDisclosed: false,
      userId: researcher2.id,
    },
    {
      title: 'Sensitive Info Disclosure via .env in Storage',
      targetSystem: 's3.cloud.local',
      severity: 'CRITICAL',
      status: 'RESOLVED',
      bountyAmount: 3000.00,
      details: 'Publicly readable storage bucket containing application credentials.',
      isDisclosed: true,
      userId: researcher1.id,
    },
    {
      title: 'Broken Access Control on Admin Panel',
      targetSystem: 'checkout.ecommerce.local',
      severity: 'HIGH',
      status: 'TRIAGED',
      bountyAmount: 1200.00,
      details: 'Low-privileged users can access endpoint /admin/orders without auth check.',
      isDisclosed: false,
      userId: researcher2.id,
    },
    {
      title: 'Open Redirect on Authentication Endpoint',
      targetSystem: 'auth.cloud.local',
      severity: 'LOW',
      status: 'REJECTED',
      bountyAmount: 0.00,
      details: 'Redirect query parameter accepts arbitrary external URLs.',
      isDisclosed: false,
      userId: researcher1.id,
    },
    {
      title: 'Rate Limit Bypass on OTP Verification',
      targetSystem: 'app.health.local',
      severity: 'MEDIUM',
      status: 'TRIAGED',
      bountyAmount: 600.00,
      details: 'IP spoofing headers can bypass standard rate limits on OTP endpoint.',
      isDisclosed: false,
      userId: researcher2.id,
    },
  ];

  const createdReports = [];
  for (const rep of reportsData) {
    const r = await prisma.report.create({ data: rep });
    createdReports.push(r);
  }

  console.log('  Created 8 Reports');

  // 4. Create Attachments (4 records)
  const attachmentsData = [
    {
      reportId: createdReports[0].id,
      originalName: 'sqli_proof.png',
      storedName: '1690000000000-sqli_proof.png',
      mimeType: 'image/png',
      sizeBytes: 245120,
    },
    {
      reportId: createdReports[1].id,
      originalName: 'xss_payload.txt',
      storedName: '1690000000001-xss_payload.txt',
      mimeType: 'text/plain',
      sizeBytes: 1024,
    },
    {
      reportId: createdReports[2].id,
      originalName: 'poc_script.py',
      storedName: '1690000000002-poc_script.py',
      mimeType: 'text/x-python',
      sizeBytes: 3410,
    },
    {
      reportId: createdReports[4].id,
      originalName: 'env_dump.json',
      storedName: '1690000000003-env_dump.json',
      mimeType: 'application/json',
      sizeBytes: 1540,
    },
  ];

  for (const att of attachmentsData) {
    await prisma.attachment.create({ data: att });
  }

  // 5. Create Comments (5 records)
  const commentsData = [
    {
      reportId: createdReports[0].id,
      userId: admin1.id,
      content: 'Confirmed vulnerability. Escalating to critical priority.',
    },
    {
      reportId: createdReports[0].id,
      userId: researcher1.id,
      content: 'Thanks! Let me know if you need additional logs or reproduction steps.',
    },
    {
      reportId: createdReports[2].id,
      userId: admin2.id,
      content: 'Fix has been deployed to production. Verifying patch...',
    },
    {
      reportId: createdReports[2].id,
      userId: researcher2.id,
      content: 'Patch verified. Issue is completely mitigated.',
    },
    {
      reportId: createdReports[6].id,
      userId: admin1.id,
      content: 'Marked as duplicate/rejected per security policy section 3.2.',
    },
  ];

  for (const com of commentsData) {
    await prisma.comment.create({ data: com });
  }

  // Record total: 4 Users + 8 Reports + 4 Attachments + 5 Comments = 21 Total Records
  console.log('Seeding complete! Total records created: 21 (4 Users, 8 Reports, 4 Attachments, 5 Comments)');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });