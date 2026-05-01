require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
 
// ── Connect ──────────────────────────────────────────────────
async function connectDB() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/cms_raisoni"
  );
  console.log("✅ MongoDB Connected");
}
 
// ── Inline Schemas ────────────────────────────────────────────
const User = mongoose.model("User", new mongoose.Schema({
  name:     String,
  email:    { type: String, unique: true },
  password: String,
  role:     { type: String, enum: ["Admin","Faculty","Student"], default: "Student" },
}, { timestamps: true }));
 
const Student = mongoose.model("Student", new mongoose.Schema({
  name:   String,
  course: String,
  year:   String,
  phone:  { type: String, default: "" },
  email:  { type: String, default: "" },
  status: { type: String, default: "Active" },
}, { timestamps: true }));
 
const Faculty = mongoose.model("Faculty", new mongoose.Schema({
  name:   String,
  dept:   String,
  exp:    { type: String, default: "" },
  salary: { type: Number, default: 70000 },
}, { timestamps: true }));
 
const Mark = mongoose.model("Mark", new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  subjects:  { type: Map, of: Number, default: {} },
}, { timestamps: true }));
 
const Fee = mongoose.model("Fee", new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  paid:      { type: Number, default: 0 },
  total:     { type: Number, default: 80000 },
}, { timestamps: true }));
 
const Notice = mongoose.model("Notice", new mongoose.Schema({
  title:    String,
  date:     String,
  category: { type: String, default: "General" },
  content:  { type: String, default: "" },
  read:     { type: Boolean, default: false },
}, { timestamps: true }));
 
const Attendance = mongoose.model("Attendance", new mongoose.Schema({
  date:    String,
  type:    { type: String, enum: ["student","faculty"], default: "student" },
  records: [{ personId: mongoose.Schema.Types.ObjectId, status: String }],
}, { timestamps: true }));
 
// ── Seed Data ─────────────────────────────────────────────────
const feeAmt = { "B.Tech":120000,"M.Tech":100000,MCA:80000,MBA:90000,BCA:60000 };
 
const seedStudents = [
  { name:"Rahul Sharma",  course:"B.Tech",year:"3rd",phone:"9876543210",email:"rahul@raisoni.ac.in", status:"Active"},
  { name:"Priya Mehta",   course:"MCA",   year:"2nd",phone:"9876543211",email:"priya@raisoni.ac.in", status:"Active"},
  { name:"Amit Verma",    course:"B.Tech",year:"1st",phone:"9876543212",email:"amit@raisoni.ac.in",  status:"Active"},
  { name:"Sneha Patil",   course:"MBA",   year:"2nd",phone:"9876543213",email:"sneha@raisoni.ac.in", status:"Active"},
  { name:"Rohan Joshi",   course:"M.Tech",year:"1st",phone:"9876543214",email:"rohan@raisoni.ac.in", status:"Active"},
  { name:"Pooja Desai",   course:"BCA",   year:"3rd",phone:"9876543215",email:"pooja@raisoni.ac.in", status:"Active"},
  { name:"Karan Singh",   course:"B.Tech",year:"2nd",phone:"9876543216",email:"karan@raisoni.ac.in", status:"Active"},
  { name:"Anjali Gupta",  course:"MCA",   year:"1st",phone:"9876543217",email:"anjali@raisoni.ac.in",status:"Active"},
  { name:"Vikas Yadav",   course:"MBA",   year:"1st",phone:"9876543218",email:"vikas@raisoni.ac.in", status:"Active"},
  { name:"Neha Kulkarni", course:"B.Tech",year:"4th",phone:"9876543219",email:"neha@raisoni.ac.in",  status:"Active"},
];
 
const seedFaculty = [
  { name:"Dr. Sharma",  dept:"Computer Science",       exp:"15 yrs",salary:95000},
  { name:"Prof. Mehta", dept:"Electronics",            exp:"12 yrs",salary:82000},
  { name:"Dr. Kapoor",  dept:"Mathematics",            exp:"10 yrs",salary:78000},
  { name:"Prof. Joshi", dept:"Mechanical",             exp:"8 yrs", salary:72000},
  { name:"Dr. Patil",   dept:"Civil Engineering",      exp:"14 yrs",salary:88000},
  { name:"Prof. Desai", dept:"Physics",                exp:"9 yrs", salary:75000},
  { name:"Dr. Verma",   dept:"Chemistry",              exp:"11 yrs",salary:80000},
  { name:"Prof. Singh", dept:"Management",             exp:"7 yrs", salary:70000},
  { name:"Dr. Gupta",   dept:"Information Technology", exp:"13 yrs",salary:91000},
  { name:"Prof. Rao",   dept:"Electrical Engineering", exp:"16 yrs",salary:98000},
];
 
const seedMarks = [
  { Maths:82,Physics:76,C_Programming:90,Electronics:71,Chemistry:65 },
  { DBMS:88,Java:92,Python:79,Networks:84,Software_Engg:77 },
  { Maths:68,Physics:72,C_Programming:81,Electronics:69,Chemistry:74 },
  { Marketing:91,Finance:85,HRM:79,Economics:88,Business_Law:73 },
  { Advanced_Maths:88,VLSI:77,Embedded:83,DSP:79,Control:71 },
  { C_Programming:74,Web_Tech:88,DBMS:82,Python:76,Networks:69 },
  { Maths:79,Physics:83,C_Programming:77,Electronics:85,Chemistry:80 },
  { DBMS:91,Java:87,Python:84,Networks:78,Software_Engg:90 },
  { Marketing:76,Finance:82,HRM:88,Economics:74,Business_Law:81 },
  { Maths:93,Physics:88,C_Programming:95,Electronics:90,Chemistry:86 },
];
 
const seedFeesPaid = [120000,80000,0,90000,50000,60000,120000,40000,90000,60000];
 
const seedNotices = [
  { title:"Semester Exam Schedule Released",    date:"2026-04-20",category:"Exam",   content:"Examination schedule released. Prepare accordingly.",                read:false},
  { title:"Annual Cultural Fest – Raisoni 2026",date:"2026-04-18",category:"Event",  content:"Cultural festival May 5-7. All students encouraged to participate.",read:false},
  { title:"Last Date for Fee Submission",        date:"2026-04-15",category:"Fee",   content:"Fee deadline April 30. Late fees apply after due date.",            read:false},
  { title:"Summer Vacation Announced",           date:"2026-04-12",category:"Holiday",content:"College closed May 15 to June 10 for summer vacation.",            read:true },
  { title:"Industry Visit – Infosys Pune",       date:"2026-04-08",category:"Event", content:"B.Tech 3rd year visit to Infosys on May 12.",                       read:true },
];
 
// ── Run ───────────────────────────────────────────────────────
async function seed() {
  await connectDB();
 
  // Drop old indexes to prevent duplicate key errors
  const db = mongoose.connection.db;
  const collections = ["users","students","faculties","marks","fees","notices","attendances"];
  for (const col of collections) {
    try { await db.collection(col).dropIndexes(); } catch (e) {}
  }
  console.log("🔧 Old indexes cleared");
 
  // Clear all data
  await Promise.all([
    User.deleteMany({}), Student.deleteMany({}), Faculty.deleteMany({}),
    Mark.deleteMany({}), Fee.deleteMany({}), Notice.deleteMany({}), Attendance.deleteMany({}),
  ]);
  console.log("🗑  Old data cleared");
 
  // Seed users
  const hashedUsers = await Promise.all([
    { name:"Admin User",   email:"admin@raisoni.ac.in",   password: await bcrypt.hash("admin123",   10), role:"Admin"   },
    { name:"Dr. Sharma",   email:"faculty@raisoni.ac.in", password: await bcrypt.hash("faculty123", 10), role:"Faculty" },
    { name:"Rahul Sharma", email:"student@raisoni.ac.in", password: await bcrypt.hash("student123", 10), role:"Student" },
  ]);
  await User.insertMany(hashedUsers);
  console.log("👤 Users seeded (3)");
 
  // Seed students + marks + fees
  const students = await Student.insertMany(seedStudents);
  console.log(`🎓 Students seeded (${students.length})`);
 
  for (let i = 0; i < students.length; i++) {
    await Mark.create({ studentId: students[i]._id, subjects: seedMarks[i] });
    await Fee.create({ studentId: students[i]._id, paid: seedFeesPaid[i], total: feeAmt[students[i].course] || 80000 });
  }
  console.log("📝 Marks seeded");
  console.log("💰 Fees seeded");
 
  // Seed faculty
  await Faculty.insertMany(seedFaculty);
  console.log(`👨‍🏫 Faculty seeded (${seedFaculty.length})`);
 
  // Seed notices
  await Notice.insertMany(seedNotices);
  console.log(`📢 Notices seeded (${seedNotices.length})`);
 
  console.log("\n✅ DATABASE SEEDED SUCCESSFULLY!");
  console.log("══════════════════════════════════════════");
  console.log("  Admin:   admin@raisoni.ac.in    / admin123");
  console.log("  Faculty: faculty@raisoni.ac.in  / faculty123");
  console.log("  Student: student@raisoni.ac.in  / student123");
  console.log("══════════════════════════════════════════");
 
  await mongoose.connection.close();
  process.exit(0);
}
 
seed().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });