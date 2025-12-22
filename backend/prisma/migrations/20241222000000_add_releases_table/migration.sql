-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "image" TEXT,
    "releaseDate" TEXT,
    "spotifyUrl" TEXT,
    "artistId" TEXT NOT NULL,
    "artistName" TEXT NOT NULL,
    "artistSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "releases_artistId_idx" ON "releases"("artistId");

-- CreateIndex
CREATE INDEX "releases_releaseDate_idx" ON "releases"("releaseDate");
