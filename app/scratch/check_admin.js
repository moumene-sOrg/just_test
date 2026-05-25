const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const admin = await prisma.users.findFirst({
        where: { role: 'admin' }
    });
    if (admin) {
        console.log(`FOUND ADMIN: ${admin.email}`);
        // We don't know the password if it's hashed, but we can see if it's plain text in the DB or just reset it.
        // Actually, the login logic supports plain text for now: (password === user.pass_word)
        console.log(`PASSWORD HINT: ${admin.pass_word}`);
    } else {
        console.log("NO ADMIN FOUND. Creating a default one...");
        const newUser = await prisma.users.create({
            data: {
                email: 'admin@rescue.com',
                pass_word: 'admin123', // Plain text for demonstration, should be hashed in prod
                first_name: 'Super',
                last_name: 'Admin',
                role: 'admin',
                account_status: 'active'
            }
        });
        console.log(`CREATED ADMIN: ${newUser.email} / admin123`);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
