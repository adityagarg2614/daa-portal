/**
 * Manual fix script for pending admin users
 * 
 * Usage: 
 * 1. Update the email and newClerkId below
 * 2. Run: node scripts/fix-admin-clerkid.js
 */

const { MongoClient } = require('mongodb');

// Configuration - UPDATE THESE VALUES
const MONGODB_URI = "mongodb+srv://adityagarg065:aditya123@cluster0.ceefwjf.mongodb.net/daa-portal?appName=Cluster0";
const ADMIN_EMAIL = "adityagarg065@gmail.com"; // Your admin email
const NEW_CLERK_ID = "user_2q9xKZL8vP3mJnRwYhT6"; // Get this from Clerk dashboard

async function fixAdminClerkId() {
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");
        
        const db = client.db("daa-portal");
        const users = db.collection("users");
        
        // Find the admin user
        const adminUser = await users.findOne({ email: ADMIN_EMAIL });
        
        if (!adminUser) {
            console.error("❌ Admin user not found!");
            return;
        }
        
        console.log("📋 Current user data:");
        console.log("  - clerkId:", adminUser.clerkId);
        console.log("  - email:", adminUser.email);
        console.log("  - role:", adminUser.role);
        console.log("  - name:", adminUser.name);
        
        if (adminUser.role !== "admin") {
            console.error("❌ This user is not an admin!");
            return;
        }
        
        // Update the clerkId
        const result = await users.updateOne(
            { email: ADMIN_EMAIL },
            { $set: { clerkId: NEW_CLERK_ID } }
        );
        
        console.log("✅ Updated clerkId!");
        console.log("📋 New user data:");
        console.log("  - clerkId:", NEW_CLERK_ID);
        console.log("  - email:", ADMIN_EMAIL);
        console.log("  - role:", "admin");
        
        console.log("\n🎉 Fix complete! Please sign out and sign in again.");
        
    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await client.close();
        console.log("🔒 MongoDB connection closed");
    }
}

fixAdminClerkId();
