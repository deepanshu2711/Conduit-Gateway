/*
  Warnings:

  - You are about to drop the column `methods` on the `RequestLog` table. All the data in the column will be lost.
  - Added the required column `method` to the `RequestLog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RequestLog" DROP COLUMN "methods",
ADD COLUMN     "method" "HttpMethod" NOT NULL,
ALTER COLUMN "routeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestLog" ADD CONSTRAINT "RequestLog_consumerId_fkey" FOREIGN KEY ("consumerId") REFERENCES "Consumer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
