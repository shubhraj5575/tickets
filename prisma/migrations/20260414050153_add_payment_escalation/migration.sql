-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingRef" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bookingDate" DATETIME NOT NULL,
    "totalAmount" REAL NOT NULL,
    "source" TEXT,
    "sourceName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "importBatchId" TEXT,
    "lateFeeRatePct" REAL NOT NULL DEFAULT 2.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Booking_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Booking" ("bookingDate", "bookingRef", "createdAt", "customerId", "id", "importBatchId", "source", "sourceName", "status", "totalAmount", "unitId", "updatedAt") SELECT "bookingDate", "bookingRef", "createdAt", "customerId", "id", "importBatchId", "source", "sourceName", "status", "totalAmount", "unitId", "updatedAt" FROM "Booking";
DROP TABLE "Booking";
ALTER TABLE "new_Booking" RENAME TO "Booking";
CREATE UNIQUE INDEX "Booking_bookingRef_key" ON "Booking"("bookingRef");
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channels" TEXT NOT NULL DEFAULT 'IN_APP',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Notification" ("body", "channels", "createdAt", "customerId", "id", "isRead", "sentAt", "title", "type") SELECT "body", "channels", "createdAt", "customerId", "id", "isRead", "sentAt", "title", "type" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE TABLE "new_PaymentSchedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "instalmentNo" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "interestAmount" REAL NOT NULL DEFAULT 0,
    "escalationStage" INTEGER NOT NULL DEFAULT 0,
    "lastEscalationAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentSchedule" ("amount", "bookingId", "createdAt", "dueDate", "id", "instalmentNo", "label", "status", "updatedAt") SELECT "amount", "bookingId", "createdAt", "dueDate", "id", "instalmentNo", "label", "status", "updatedAt" FROM "PaymentSchedule";
DROP TABLE "PaymentSchedule";
ALTER TABLE "new_PaymentSchedule" RENAME TO "PaymentSchedule";
CREATE UNIQUE INDEX "PaymentSchedule_bookingId_instalmentNo_key" ON "PaymentSchedule"("bookingId", "instalmentNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
