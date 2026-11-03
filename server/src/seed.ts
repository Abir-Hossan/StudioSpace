import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Studio } from "./models/index.js";
export async function seed() {
  if (await Studio.countDocuments()) return;
  const hash = await bcrypt.hash("StudioPass1", 12);
  const host = await User.findOneAndUpdate(
    { email: "host@studiospace.local" },
    {
      $setOnInsert: {
        name: "Marcus Vance",
        passwordHash: hash,
        photoURL: "",
        authenticationProvider: "credentials",
      },
    },
    { upsert: true, new: true },
  );
  await User.findOneAndUpdate(
    { email: "creator@studiospace.local" },
    {
      $setOnInsert: {
        name: "Alex Rivera",
        passwordHash: hash,
        photoURL: "",
        authenticationProvider: "credentials",
      },
    },
    { upsert: true, new: true },
  );
  const names = [
    "The Obsidian Soundstage",
    "Daylight Loft — East Side",
    "Analog House Recording Suite",
    "The Conversation Room",
    "Canvas & Clay Workshop",
    "Whitebox Cyclorama",
    "Golden Hour Loft",
    "The Green Screen Stage",
    "Walnut Sound Lab",
    "Maker’s Corner",
    "The Editorial Studio",
    "Frame One Production",
  ];
  const cats = [
    "Film Stages",
    "Photo Studios",
    "Music Suites",
    "Podcast Rooms",
    "Art Workshops",
    "Photo Studios",
    "Photo Studios",
    "Film Stages",
    "Music Suites",
    "Art Workshops",
    "Photo Studios",
    "Film Stages",
  ];
  const imgs = [
    "film",
    "daylight",
    "music",
    "podcast",
    "art",
    "cyclorama",
    "photo",
    "green-screen",
    "music",
    "workshop",
    "lounge",
    "film",
  ];
  await Studio.insertMany(
    names.map((title, i) => ({
      title,
      category: cats[i],
      hourlyRate: 45 + i * 15,
      securityDeposit: 100,
      maxCapacity: 6 + i * 2,
      address: `${120 + i} Creative Avenue`,
      city: i % 2 ? "Dhaka" : "Brooklyn",
      country: i % 2 ? "Bangladesh" : "United States",
      images: [
        `/images/studio-${imgs[i]}.png`,
        "/images/studio-gallery-1.png",
        "/images/studio-gallery-2.png",
      ],
      amenities: [
        "High-speed Wi-Fi",
        "Climate control",
        "Equipment storage",
        "Restroom",
        "Lighting kit",
      ],
      overview:
        "A thoughtfully equipped creative space with flexible working zones, controlled lighting and room to bring your next idea to life. Discuss equipment requirements with your host before arrival.",
      createdAt:new Date(Date.now()-i*1000),
      ...(i===0?{title:'Frame 24 Production Stage',hourlyRate:85,securityDeposit:250,maxCapacity:40,address:'540 S Santa Fe Avenue, Arts District',city:'Los Angeles',country:'United States',images:['main','control','cyclorama','makeup','lounge'].map(name=>'/images/reference-stage-'+name+'.png'),specs:{usableArea:3500,gridHeight:18,powerSupply:'3-Phase 200A / 120–208V distribution',soundproofRating:'STC 65',access:'14 ft × 14 ft ground-level drive-in bay',parking:'10 gated production parking spaces'},amenities:['High-speed Wi-Fi','Lighting kit','Climate control','Equipment storage','Restroom','Green room','Changing room','Ground-floor access'],rules:['Quiet production conditions must be agreed with the host.','Haze, pyrotechnics and specialist activities require prior host approval.','Leave the stage clean and return equipment to its agreed position.','Additional studio hours require host approval.'],overview:"Frame 24 is a precision-engineered Class-A production stage located in the heart of the Arts District. Originally an early-century steel foundry, the facility has been retrofitted from ground up with double-wall floating acoustic decoupling, delivering an exceptional STC 65 sound isolation rating suitable for high-fidelity dialogue recording, live acoustic sessions, and feature cinematography.\n\nOur stage integrates a 32-foot modular two-wall cyclorama, a continuous motorized lighting grid rated for 15,000 lbs distributed rig weight, and an authentic ground-level drive-in bay measuring 12ft × 14ft. From commercial automotive captures to episodic television shoots, loading camera package trucks and set fabrication elements is instantaneous and seamless.\n\nEquipped with dedicated 3-phase 200A Camlock power drops, silent duct baffled climate control systems operating below NC-25, and a separate VIP green lounge with private dressing rooms, Frame 24 empowers production teams with total autonomy and friction-free operations."}:{}),
      ownerId: host._id,
      ownerEmail: host.email,
      ownerName: host.name,
    })),
  );
}
if (process.argv[1]?.endsWith("seed.ts")) {
  if (!process.env.MONGODB_URI) throw new Error("Set MONGODB_URI");
  await mongoose.connect(process.env.MONGODB_URI);
  await seed();
  await mongoose.disconnect();
  console.log("Seed complete");
}
