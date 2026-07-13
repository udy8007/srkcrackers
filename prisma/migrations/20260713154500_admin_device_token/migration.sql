-- Restore FCM device tokens for admin WebView APK push
CREATE TABLE IF NOT EXISTS "AdminDeviceToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'android',
    "adminUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminDeviceToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AdminDeviceToken_token_key" ON "AdminDeviceToken"("token");
CREATE INDEX IF NOT EXISTS "AdminDeviceToken_adminUserId_idx" ON "AdminDeviceToken"("adminUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'AdminDeviceToken_adminUserId_fkey'
  ) THEN
    ALTER TABLE "AdminDeviceToken"
      ADD CONSTRAINT "AdminDeviceToken_adminUserId_fkey"
      FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
