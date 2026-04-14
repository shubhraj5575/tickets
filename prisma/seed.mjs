import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { resolve } from "path";

const dbPath = resolve(process.cwd(), "dev.db");
console.log("DB path:", dbPath);
const libsql = createClient({ url: `file:${dbPath}` });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      phone: "9999999999",
      role: "ADMIN",
      email: "admin@onegroup.in",
    },
  });

  // Create customer users
  const customerUser = await prisma.user.create({
    data: { phone: "9876543210", role: "CUSTOMER" },
  });

  const customerUser2 = await prisma.user.create({
    data: { phone: "9876543211", role: "CUSTOMER" },
  });

  // Create projects
  const project1 = await prisma.project.create({
    data: {
      name: "The Clermont",
      subProject: "Phase 1",
      city: "Gurugram",
      state: "Haryana",
      sector: "Sector 91",
      type: "RESIDENTIAL",
      status: "ONGOING",
      reraNumber: "RERA-HR-GGM-2024-0042",
      expectedCompletion: new Date("2027-06-30"),
      description: "Premium independent floors in Sector 91, Gurugram",
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: "One City Hub",
      city: "Gurugram",
      state: "Haryana",
      sector: "Sector 108",
      type: "COMMERCIAL",
      status: "ONGOING",
      reraNumber: "RERA-HR-GGM-2024-0087",
      expectedCompletion: new Date("2026-12-31"),
      description: "Commercial office spaces in Sector 108",
    },
  });

  // Create units
  const unit1 = await prisma.unit.create({
    data: {
      projectId: project1.id,
      unitNumber: "B-61/04",
      unitType: "Independent Floor",
      floor: 2,
      areaSqFt: 1850,
      reraAreaSqFt: 1650,
      basePricePSF: 8500,
      totalPrice: 15725000,
      paymentPlanType: "DOWN_PAYMENT",
      possessionDate: new Date("2027-03-31"),
      status: "BOOKED",
    },
  });

  const unit2 = await prisma.unit.create({
    data: {
      projectId: project1.id,
      unitNumber: "C-22/01",
      unitType: "Plot",
      areaSqFt: 2400,
      basePricePSF: 12000,
      totalPrice: 28800000,
      paymentPlanType: "CONSTRUCTION_LINKED",
      possessionDate: new Date("2027-06-30"),
      status: "BOOKED",
    },
  });

  // Create customers
  const customer1 = await prisma.customer.create({
    data: {
      userId: customerUser.id,
      title: "Mr.",
      name: "Rajesh Kumar Sharma",
      email: "rajesh.sharma@gmail.com",
      phone: "9876543210",
      altPhone: "9876543200",
      address: "45, Model Town, Phase 2",
      city: "Delhi",
      state: "Delhi",
      pincode: "110009",
      panNumber: "ABCPS1234K",
      aadhaarNumber: "1234-5678-9012",
      profession: "Business Owner",
      companyName: "Sharma Enterprises",
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      userId: customerUser2.id,
      title: "Mrs.",
      name: "Priya Mehta",
      email: "priya.mehta@outlook.com",
      phone: "9876543211",
      address: "B-12, Green Park Extension",
      city: "Delhi",
      state: "Delhi",
      pincode: "110016",
      panNumber: "DEFPM5678L",
      profession: "Software Engineer",
      companyName: "TechCorp India",
    },
  });

  // Create bookings
  const booking1 = await prisma.booking.create({
    data: {
      bookingRef: "B-61/04",
      customerId: customer1.id,
      unitId: unit1.id,
      bookingDate: new Date("2025-08-15"),
      totalAmount: 15725000,
      source: "Walk-in",
      status: "ACTIVE",
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      bookingRef: "C-22/01",
      customerId: customer2.id,
      unitId: unit2.id,
      bookingDate: new Date("2025-10-01"),
      totalAmount: 28800000,
      source: "Referral",
      sourceName: "Rajesh Sharma",
      status: "ACTIVE",
    },
  });

  // Co-applicant
  await prisma.coApplicant.create({
    data: {
      bookingId: booking1.id,
      name: "Sunita Sharma",
      phone: "9876543201",
      relationship: "Spouse",
      panNumber: "GHIJS9012M",
    },
  });

  // Payment schedules for booking 1
  const schedules1 = [
    { no: 1, label: "Booking Amount", due: "2025-08-15", amount: 500000, status: "PAID" },
    { no: 2, label: "Within 30 Days", due: "2025-09-15", amount: 2500000, status: "PAID" },
    { no: 3, label: "On Completion of Foundation", due: "2025-12-15", amount: 2000000, status: "PAID" },
    { no: 4, label: "On Completion of Structure", due: "2026-03-15", amount: 2500000, status: "PAID" },
    { no: 5, label: "On Completion of Brickwork", due: "2026-06-15", amount: 2000000, status: "UPCOMING" },
    { no: 6, label: "On Completion of Plastering", due: "2026-09-15", amount: 2000000, status: "UPCOMING" },
    { no: 7, label: "On Completion of Flooring", due: "2026-12-15", amount: 2000000, status: "UPCOMING" },
    { no: 8, label: "On Offer of Possession", due: "2027-03-15", amount: 2225000, status: "UPCOMING" },
  ];

  for (const s of schedules1) {
    const schedule = await prisma.paymentSchedule.create({
      data: {
        bookingId: booking1.id,
        instalmentNo: s.no,
        label: s.label,
        dueDate: new Date(s.due),
        amount: s.amount,
        status: s.status,
      },
    });
    if (s.status === "PAID") {
      await prisma.payment.create({
        data: {
          bookingId: booking1.id,
          scheduleId: schedule.id,
          amount: s.amount,
          paymentDate: new Date(s.due),
          paymentMode: s.no === 1 ? "Cheque" : "NEFT",
          referenceNumber: `TXN${Date.now()}${s.no}`,
          markedBy: adminUser.id,
        },
      });
    }
  }

  // Payment schedules for booking 2
  const schedules2 = [
    { no: 1, label: "Booking Amount", due: "2025-10-01", amount: 1000000, status: "PAID" },
    { no: 2, label: "Within 45 Days", due: "2025-11-15", amount: 5000000, status: "PAID" },
    { no: 3, label: "On Start of Construction", due: "2026-01-15", amount: 4000000, status: "OVERDUE" },
    { no: 4, label: "On Completion of Foundation", due: "2026-06-15", amount: 5000000, status: "UPCOMING" },
    { no: 5, label: "On Completion of Structure", due: "2026-10-15", amount: 5000000, status: "UPCOMING" },
    { no: 6, label: "On Offer of Possession", due: "2026-12-31", amount: 8800000, status: "UPCOMING" },
  ];

  for (const s of schedules2) {
    const schedule = await prisma.paymentSchedule.create({
      data: {
        bookingId: booking2.id,
        instalmentNo: s.no,
        label: s.label,
        dueDate: new Date(s.due),
        amount: s.amount,
        status: s.status,
      },
    });
    if (s.status === "PAID") {
      await prisma.payment.create({
        data: {
          bookingId: booking2.id,
          scheduleId: schedule.id,
          amount: s.amount,
          paymentDate: new Date(s.due),
          paymentMode: "RTGS",
          referenceNumber: `TXN${Date.now()}${s.no}`,
          markedBy: adminUser.id,
        },
      });
    }
  }

  // Construction updates
  const updates = [
    { title: "Site Clearing Complete", stage: "FOUNDATION", date: "2025-09-01", type: "PHOTO" },
    { title: "Foundation Work Started", stage: "FOUNDATION", date: "2025-10-15", type: "PHOTO" },
    { title: "Foundation Complete - Block B", stage: "FOUNDATION", date: "2025-12-20", type: "PHOTO" },
    { title: "Structure Work Progress", stage: "STRUCTURE", date: "2026-02-10", type: "PHOTO" },
    { title: "Structure Complete - Ground Floor", stage: "STRUCTURE", date: "2026-03-25", type: "DRONE" },
    { title: "Brickwork Started", stage: "BRICKWORK", date: "2026-04-05", type: "PHOTO" },
  ];

  for (const u of updates) {
    await prisma.constructionUpdate.create({
      data: {
        projectId: project1.id,
        title: u.title,
        description: `Progress update: ${u.title}`,
        stage: u.stage,
        date: new Date(u.date),
        mediaType: u.type,
        mediaUrl: `https://placehold.co/800x600/e2e8f0/475569?text=${encodeURIComponent(u.title)}`,
        source: "MANUAL",
      },
    });
  }

  // Documents
  for (const d of [
    { type: "BOOKING_FORM", title: "Booking Application Form - B-61/04" },
    { type: "ALLOTMENT_LETTER", title: "Allotment Letter - B-61/04" },
    { type: "AGREEMENT_TO_SELL", title: "Agreement to Sell - B-61/04" },
    { type: "DEMAND_LETTER", title: "3rd Instalment Demand Letter" },
  ]) {
    await prisma.document.create({
      data: {
        customerId: customer1.id,
        bookingId: booking1.id,
        type: d.type,
        title: d.title,
        fileUrl: "#",
        fileSize: 256000,
        mimeType: "application/pdf",
        uploadedBy: "ADMIN",
        isNotified: true,
      },
    });
  }

  // Tickets
  await prisma.ticket.create({
    data: {
      ticketRef: "TKT-20260401-001",
      customerId: customer1.id,
      category: "PAYMENT_DISPUTE",
      subject: "3rd instalment amount clarification",
      description: "The demand letter shows Rs 20,00,000 but my payment plan says Rs 19,50,000.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assignedTo: adminUser.id,
      messages: {
        create: [
          { senderId: customer1.userId, message: "Please check the amount mentioned in demand letter vs my booking form." },
          { senderId: adminUser.id, message: "We are looking into this. The difference might be due to GST adjustment. Will update you by tomorrow." },
        ],
      },
    },
  });

  await prisma.ticket.create({
    data: {
      ticketRef: "TKT-20260405-002",
      customerId: customer1.id,
      category: "CONSTRUCTION_QUERY",
      subject: "When will structure work complete?",
      description: "Can you provide an estimated date for completion of structure work for Block B?",
      status: "OPEN",
      priority: "MEDIUM",
    },
  });

  await prisma.ticket.create({
    data: {
      ticketRef: "TKT-20260408-003",
      customerId: customer2.id,
      category: "NAME_CHANGE",
      subject: "Add co-applicant to booking",
      description: "I want to add my husband Amit Mehta as co-applicant.",
      status: "RESOLVED",
      priority: "MEDIUM",
      assignedTo: adminUser.id,
      resolvedAt: new Date("2026-04-09"),
      messages: {
        create: [
          { senderId: customer2.userId, message: "Please add co-applicant details as mentioned." },
          { senderId: adminUser.id, message: "Co-applicant has been added. Please check your updated booking form." },
        ],
      },
    },
  });

  // Notifications
  for (const n of [
    { cid: customer1.id, type: "PAYMENT_CONFIRMATION", title: "Payment Received", body: "Your 4th instalment of ₹25,00,000 has been received.", isRead: true },
    { cid: customer1.id, type: "CONSTRUCTION_UPDATE", title: "Construction Update", body: "Brickwork has started for Block B. Check the latest photos.", isRead: false },
    { cid: customer1.id, type: "DOCUMENT_ADDED", title: "New Document", body: "Demand letter for 5th instalment has been uploaded.", isRead: false },
    { cid: customer1.id, type: "PAYMENT_REMINDER", title: "Payment Due in 7 Days", body: "Your 5th instalment of ₹20,00,000 is due on 15 Jun 2026.", isRead: false },
    { cid: customer2.id, type: "PAYMENT_REMINDER", title: "Payment Overdue", body: "Your 3rd instalment of ₹40,00,000 was due on 15 Jan 2026.", isRead: false },
    { cid: customer2.id, type: "TICKET_UPDATE", title: "Ticket Resolved", body: "Your ticket TKT-20260408-003 has been resolved.", isRead: true },
  ]) {
    await prisma.notification.create({
      data: { customerId: n.cid, type: n.type, title: n.title, body: n.body, channels: "IN_APP,SMS", isRead: n.isRead, sentAt: new Date() },
    });
  }

  // Referrals
  await prisma.referral.create({ data: { referrerId: customer1.id, referralCode: "RAJESH-ONE-2025", refereeName: "Priya Mehta", refereePhone: "9876543211", status: "BOOKING", rewardAmount: 100000 } });
  await prisma.referral.create({ data: { referrerId: customer1.id, referralCode: "RAJESH-ONE-2026", refereeName: "Vikram Singh", refereePhone: "9876543212", status: "SITE_VISIT" } });
  await prisma.referral.create({ data: { referrerId: customer1.id, referralCode: "RAJESH-ONE-2026B", refereeName: "Neha Gupta", refereePhone: "9876543213", status: "LEAD" } });

  // Possession steps
  for (const s of [
    { no: 1, title: "Structure Complete", status: "DONE", est: "2026-03-31", completed: "2026-03-25" },
    { no: 2, title: "Internal Finishing In Progress", status: "IN_PROGRESS", est: "2026-09-30", completed: null },
    { no: 3, title: "External Development", status: "UPCOMING", est: "2026-12-31", completed: null },
    { no: 4, title: "OC Applied", status: "UPCOMING", est: "2027-01-15", completed: null },
    { no: 5, title: "OC Received", status: "UPCOMING", est: "2027-02-15", completed: null },
    { no: 6, title: "Possession Date Announced", status: "UPCOMING", est: "2027-02-28", completed: null },
    { no: 7, title: "Registry Guidance Shared", status: "UPCOMING", est: "2027-03-15", completed: null },
  ]) {
    await prisma.possessionStep.create({
      data: { bookingId: booking1.id, stepNumber: s.no, title: s.title, status: s.status, estimatedDate: new Date(s.est), completedDate: s.completed ? new Date(s.completed) : null },
    });
  }

  // Community
  await prisma.announcement.create({ data: { projectId: project1.id, title: "Diwali Celebration at Site", body: "Join us for a Diwali celebration at The Clermont site on 20th October. All buyers welcome!" } });
  await prisma.announcement.create({ data: { projectId: project1.id, title: "Construction Milestone", body: "Structure work for Block A and B is complete. Brickwork has commenced." } });

  for (const f of [
    { q: "When is the expected possession date?", a: "Expected possession for The Clermont Phase 1 is March 2027.", cat: "Possession" },
    { q: "How will society formation work?", a: "Society formation will begin after 50% of units receive possession.", cat: "Society" },
    { q: "What amenities are included?", a: "Clubhouse, swimming pool, gym, landscaped gardens, children's play area, 24/7 security.", cat: "Amenities" },
    { q: "Can I visit the construction site?", a: "Yes, site visits every Saturday 10 AM - 4 PM. Book through portal.", cat: "General" },
  ]) {
    await prisma.faq.create({ data: { projectId: project1.id, question: f.q, answer: f.a, category: f.cat } });
  }

  await prisma.event.create({ data: { projectId: project1.id, title: "Site Visit Day", description: "Monthly open site visit for all buyers.", eventDate: new Date("2026-04-20"), location: "The Clermont Site, Sector 91" } });
  await prisma.event.create({ data: { projectId: project1.id, title: "Buyer Community Meetup", description: "Meet other buyers. Networking and project updates.", eventDate: new Date("2026-05-10"), location: "ONE Group Office, Sector 44" } });

  // Partner banks
  for (const b of [
    { name: "HDFC Bank", rate: 8.75, max: 50000000, fee: "0.5% of loan amount", contact: "Arun Kapoor", phone: "9811234567", email: "arun@hdfc.com" },
    { name: "SBI Home Loans", rate: 8.50, max: 100000000, fee: "₹10,000 flat", contact: "Meera Joshi", phone: "9811234568", email: "meera@sbi.co.in" },
    { name: "ICICI Bank", rate: 8.85, max: 50000000, fee: "0.5% + GST", contact: "Rahul Verma", phone: "9811234569", email: "rahul@icici.com" },
    { name: "Axis Bank", rate: 9.00, max: 30000000, fee: "₹15,000 flat", contact: "Sneha Patel", phone: "9811234570", email: "sneha@axis.com" },
  ]) {
    await prisma.partnerBank.create({
      data: {
        bankName: b.name, interestRate: b.rate, maxLoanAmount: b.max, processingFee: b.fee,
        contactPerson: b.contact, contactPhone: b.phone, contactEmail: b.email,
        documentChecklist: JSON.stringify(["PAN Card", "Aadhaar Card", "Last 6 months bank statements", "Last 3 years ITR", "Salary slips", "Property documents"]),
      },
    });
  }

  // Dev OTPs (hashed "123456")
  const hashedOtp = await bcrypt.hash("123456", 10);
  await prisma.otpRequest.create({ data: { phone: "9876543210", otp: hashedOtp, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } });
  await prisma.otpRequest.create({ data: { phone: "9999999999", otp: hashedOtp, expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) } });

  console.log("\nSeed complete!");
  console.log("\nDemo accounts:");
  console.log("  Customer: 9876543210 (OTP: 123456)");
  console.log("  Admin:    9999999999 (OTP: 123456)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
