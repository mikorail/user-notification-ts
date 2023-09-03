-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT,
    "nation" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "birthday" TIMESTAMP(3),
    "gen_status" BOOLEAN NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "userid" INTEGER NOT NULL,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "status" BOOLEAN,
    "sent_at" TIMESTAMP(3),
    "birthday" TIMESTAMP(3),
    "nation" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Message_userid_key" ON "Message"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "Message_email_key" ON "Message"("email");
