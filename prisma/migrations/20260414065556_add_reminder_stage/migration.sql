-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "reminderStage" INTEGER NOT NULL DEFAULT 0,
    "lastEscalationAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSchedule_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PaymentSchedule" ("amount", "bookingId", "createdAt", "dueDate", "escalationStage", "id", "instalmentNo", "interestAmount", "label", "lastEscalationAt", "status", "updatedAt") SELECT "amount", "bookingId", "createdAt", "dueDate", "escalationStage", "id", "instalmentNo", "interestAmount", "label", "lastEscalationAt", "status", "updatedAt" FROM "PaymentSchedule";
DROP TABLE "PaymentSchedule";
ALTER TABLE "new_PaymentSchedule" RENAME TO "PaymentSchedule";
CREATE UNIQUE INDEX "PaymentSchedule_bookingId_instalmentNo_key" ON "PaymentSchedule"("bookingId", "instalmentNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
