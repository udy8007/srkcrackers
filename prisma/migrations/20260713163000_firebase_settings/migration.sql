-- Firebase service account storage (admin Settings upload)
CREATE TABLE IF NOT EXISTS "FirebaseSettings" (
    "id" TEXT NOT NULL,
    "serviceAccountJson" TEXT NOT NULL DEFAULT '',
    "projectId" TEXT NOT NULL DEFAULT '',
    "clientEmail" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FirebaseSettings_pkey" PRIMARY KEY ("id")
);
