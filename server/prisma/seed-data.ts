import type {
  AnimalStatus,
  DonationStatus,
  Gender,
  HousingType,
  ReviewStatus,
  Role,
  Species,
} from "@prisma/client";

/**
 * Seed data. Records reference each other by `key` / email, never by database id
 * (ids keep growing on every re-seed). `daysAgo` values are relative to the moment the seed runs.
 * seed.ts checks all the consistency rules before writing anything.
 */

export const SEED_PASSWORD = "password123";

// ─────────────────────────── Users ───────────────────────────

export type UserSeed = { name: string; email: string; phone: string; role: Role };

export const users: UserSeed[] = [
  { name: "ผู้ดูแลระบบ", email: "admin@test.com", phone: "0800000000", role: "ADMIN" },
  { name: "สมชาย ใจดี", email: "user1@test.com", phone: "0811111111", role: "USER" },
  { name: "สุดารัตน์ รักสัตว์", email: "user2@test.com", phone: "0822222222", role: "USER" },
  { name: "วิทยา ศรีสุข", email: "user3@test.com", phone: "0833333333", role: "USER" },
  { name: "นภัสสร พงษ์ไทย", email: "user4@test.com", phone: "0844444444", role: "USER" },
  { name: "ธนพล แก้วมณี", email: "user5@test.com", phone: "0855555555", role: "USER" },
];

// ─────────────────────────── Animals ───────────────────────────

export type AnimalSeed = {
  key: string;
  name: string;
  species: Species;
  breed: string;
  gender: Gender;
  ageMonths: number;
  personality: string;
  healthNote: string;
  isVaccinated: boolean;
  isUrgent: boolean;
  locationFound: string;
  status: AnimalStatus;
  /** Number of placeholder photos (1–5) */
  images: number;
  daysAgo: number;
  /** Only for ADOPTED animals */
  adoptedDaysAgo?: number;
};

export const animals: AnimalSeed[] = [
  {
    key: "khaotang", name: "ข้าวตัง", species: "DOG", breed: "ไทยหลังอาน", gender: "MALE", ageMonths: 18,
    personality: "ร่าเริง ขี้เล่น ชอบวิ่งเล่นในสนาม เข้ากับเด็กได้ดี",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว สุขภาพแข็งแรง",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยลาดพร้าว 101 เขตบางกะปิ",
    status: "ADOPTED", images: 4, daysAgo: 160, adoptedDaysAgo: 140,
  },
  {
    key: "makham", name: "มะขาม", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 36,
    personality: "ใจดี นิ่ง ๆ ชอบนอนอาบแดด เดินสายจูงเก่ง",
    healthNote: "ทำหมันแล้ว มีโรคผิวหนังเล็กน้อย กำลังรักษาด้วยยาทา",
    isVaccinated: true, isUrgent: false, locationFound: "ตลาดนัดจตุจักร เขตจตุจักร",
    status: "AVAILABLE", images: 3, daysAgo: 120,
  },
  {
    key: "mochi", name: "โมจิ", species: "DOG", breed: "ปอมเมอเรเนียนผสม", gender: "FEMALE", ageMonths: 24,
    personality: "ขี้อ้อน ติดคน ชอบให้อุ้ม เห่าเสียงแหลมเวลาตื่นเต้น",
    healthNote: "ถูกทิ้งหน้าคอนโด ขนร่วงจากความเครียด ตอนนี้ขนเริ่มขึ้นแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "หน้าคอนโดย่านอ่อนนุช เขตสวนหลวง",
    status: "PENDING", images: 5, daysAgo: 75,
  },
  {
    key: "jaodam", name: "เจ้าดำ", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 60,
    personality: "สุขุม รักเจ้าของ เฝ้าบ้านเก่งแต่ไม่ดุ",
    healthNote: "ขาหลังซ้ายเคยหัก เดินกะเผลกเล็กน้อยแต่ไม่เจ็บแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ใต้สะพานพระราม 8 เขตบางพลัด",
    status: "AVAILABLE", images: 2, daysAgo: 200,
  },
  {
    key: "som-o", name: "ส้มโอ", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 14,
    personality: "แมวส้มขี้อ้อน ชอบนอนตัก ชอบเล่นไม้ตกแมว",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ร้านข้าวมันไก่ ซอยอารีย์ เขตพญาไท",
    status: "ADOPTED", images: 3, daysAgo: 150, adoptedDaysAgo: 130,
  },
  {
    key: "thungthong", name: "ถุงทอง", species: "DOG", breed: "ไทยบางแก้วผสม", gender: "MALE", ageMonths: 6,
    personality: "ซุกซน ช่างสงสัย กำลังหัดนั่งและรอคำสั่ง",
    healthNote: "ฉีดวัคซีนเข็มแรกแล้ว รอเข็มกระตุ้นสัปดาห์หน้า",
    isVaccinated: false, isUrgent: false, locationFound: "หน้าวัดบางนาใน เขตบางนา",
    status: "AVAILABLE", images: 2, daysAgo: 20,
  },
  {
    key: "dang", name: "ด่าง", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 30,
    personality: "ขี้กลัวคนแปลกหน้าในช่วงแรก แต่ถ้าคุ้นแล้วจะติดมาก",
    healthNote: "ถูกรถเฉี่ยว ขาหน้าขวาเพิ่งผ่าตัดใส่เหล็ก ต้องการบ้านที่ดูแลใกล้ชิด",
    isVaccinated: false, isUrgent: true, locationFound: "ปากซอยรามคำแหง 24 เขตบางกะปิ",
    status: "AVAILABLE", images: 3, daysAgo: 12,
  },
  {
    key: "nomsod", name: "นมสด", species: "CAT", breed: "ขาวมณี", gender: "FEMALE", ageMonths: 10,
    personality: "เรียบร้อย ขี้เกรงใจ ชอบนั่งริมหน้าต่าง",
    healthNote: "ตาสองสี หูได้ยินปกติ ทำหมันแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยทองหล่อ เขตวัฒนา",
    status: "AVAILABLE", images: 4, daysAgo: 45,
  },
  {
    key: "pudding", name: "พุดดิ้ง", species: "DOG", breed: "พุดเดิ้ลผสม", gender: "FEMALE", ageMonths: 40,
    personality: "อ่อนโยน ชอบให้แปรงขน เข้ากับแมวได้",
    healthNote: "ทำหมันแล้ว ฟันเริ่มมีหินปูน",
    isVaccinated: true, isUrgent: false, locationFound: "หมู่บ้านเสนานิเวศน์ เขตลาดพร้าว",
    status: "ADOPTED", images: 3, daysAgo: 140, adoptedDaysAgo: 118,
  },
  {
    key: "khaitun", name: "ไข่ตุ๋น", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 4,
    personality: "ลูกแมวสามสีพลังเยอะ ชอบไล่จับเท้าคน",
    healthNote: "ถ่ายพยาธิแล้ว ยังฉีดวัคซีนไม่ครบ",
    isVaccinated: false, isUrgent: false, locationFound: "ตลาดบางกะปิ เขตบางกะปิ",
    status: "AVAILABLE", images: 2, daysAgo: 10,
  },
  {
    key: "mok", name: "หมอก", species: "CAT", breed: "โคราช (สีสวาด)", gender: "MALE", ageMonths: 20,
    personality: "สุขุม ชอบอยู่เงียบ ๆ ไม่ชอบเสียงดัง",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isUrgent: false, locationFound: "วัดพระศรีมหาธาตุ เขตบางเขน",
    status: "PENDING", images: 3, daysAgo: 60,
  },
  {
    key: "chaokuay", name: "เฉาก๊วย", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 84,
    personality: "หมาสูงวัยใจดี ชอบเดินเล่นช้า ๆ ตอนเย็น",
    healthNote: "มีต้อกระจกตาซ้าย ต้องกินยาบำรุงข้อทุกวัน",
    isVaccinated: true, isUrgent: true, locationFound: "สวนลุมพินี เขตปทุมวัน",
    status: "AVAILABLE", images: 2, daysAgo: 90,
  },
  {
    key: "thongyip", name: "ทองหยิบ", species: "DOG", breed: "โกลเด้นรีทรีฟเวอร์ผสม", gender: "MALE", ageMonths: 15,
    personality: "พลังเยอะ ชอบเล่นน้ำ ชอบคาบของมาให้",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isUrgent: false, locationFound: "ริมคลองแสนแสบ เขตวังทองหลาง",
    status: "AVAILABLE", images: 5, daysAgo: 55,
  },
  {
    key: "mali", name: "มะลิ", species: "CAT", breed: "วิเชียรมาศ", gender: "FEMALE", ageMonths: 26,
    personality: "ช่างพูด ร้องทักทายทุกครั้งที่เจอคน ติดเจ้าของ",
    healthNote: "ทำหมันแล้ว ฉีดวัคซีนครบ",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยประชาราษฎร์บำเพ็ญ เขตห้วยขวาง",
    status: "ADOPTED", images: 4, daysAgo: 130, adoptedDaysAgo: 110,
  },
  {
    key: "lukchin", name: "ลูกชิ้น", species: "DOG", breed: "ชิสุผสม", gender: "MALE", ageMonths: 48,
    personality: "ขี้เซา ชอบนอน ไม่ค่อยเห่า",
    healthNote: "ขนพันกันมากตอนพบ ตัดขนแล้ว มีเห็บเล็กน้อยกำลังรักษา",
    isVaccinated: false, isUrgent: false, locationFound: "ตลาดคลองเตย เขตคลองเตย",
    status: "AVAILABLE", images: 2, daysAgo: 35,
  },
  {
    key: "khanun", name: "ขนุน", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 30,
    personality: "แมวส้มนักเลงคุมซอย แต่กับคนขี้อ้อนมาก",
    healthNote: "หูขวามีรอยแหว่งจากการต่อสู้ ทำหมันแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยเจริญกรุง 32 เขตบางรัก",
    status: "AVAILABLE", images: 3, daysAgo: 70,
  },
  {
    key: "taohu", name: "เต้าหู้", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 12,
    personality: "หมาขาวเรียบร้อย ขี้อาย เดินตามคนที่ไว้ใจ",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "หน้ามหาวิทยาลัยเกษตรศาสตร์ เขตจตุจักร",
    status: "PENDING", images: 3, daysAgo: 50,
  },
  {
    key: "chocolate", name: "ช็อกโกแลต", species: "DOG", breed: "ลาบราดอร์ผสม", gender: "MALE", ageMonths: 26,
    personality: "เป็นมิตรกับทุกคน ชอบกินเป็นชีวิตจิตใจ",
    healthNote: "น้ำหนักเกินเล็กน้อย กำลังคุมอาหาร",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยรัชดาภิเษก 36 เขตจตุจักร",
    status: "AVAILABLE", images: 4, daysAgo: 40,
  },
  {
    key: "puifai", name: "ปุยฝ้าย", species: "CAT", breed: "เปอร์เซียผสม", gender: "FEMALE", ageMonths: 36,
    personality: "ชอบนอนบนโซฟา ไม่ชอบให้อุ้มนาน ๆ",
    healthNote: "ขนยาวต้องแปรงทุกวัน มีน้ำตาไหลเล็กน้อย",
    isVaccinated: true, isUrgent: false, locationFound: "คอนโดย่านพระราม 9 เขตห้วยขวาง",
    status: "AVAILABLE", images: 3, daysAgo: 65,
  },
  {
    key: "bualoi", name: "บัวลอย", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 22,
    personality: "ร่าเริง ชอบเล่นกับหมาตัวอื่น",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isUrgent: false, locationFound: "ชุมชนริมทางรถไฟมักกะสัน เขตราชเทวี",
    status: "ADOPTED", images: 3, daysAgo: 125, adoptedDaysAgo: 100,
  },
  {
    key: "toob", name: "ตูบ", species: "DOG", breed: "ไทยหลังอาน", gender: "MALE", ageMonths: 9,
    personality: "ขี้เล่น ซื่อสัตย์ เรียนรู้ไว",
    healthNote: "ฉีดวัคซีนพิษสุนัขบ้าแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ตลาดมีนบุรี เขตมีนบุรี",
    status: "AVAILABLE", images: 2, daysAgo: 25,
  },
  {
    key: "lukkaew", name: "ลูกแก้ว", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 1,
    personality: "ลูกแมวตัวเล็ก ร้องเรียกแม่ตลอดเวลา",
    healthNote: "พบตอนอายุราว 3 สัปดาห์ ต้องป้อนนมทุก 3-4 ชั่วโมง",
    isVaccinated: false, isUrgent: true, locationFound: "ตลาดห้วยขวาง เขตห้วยขวาง",
    status: "AVAILABLE", images: 2, daysAgo: 8,
  },
  {
    key: "khaoniao", name: "ข้าวเหนียว", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 16,
    personality: "แมวขาวดำ ชอบเล่นซ่อนหา ชอบกล่องกระดาษ",
    healthNote: "ทำหมันแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยสาทร 11 เขตสาทร",
    status: "AVAILABLE", images: 3, daysAgo: 48,
  },
  {
    key: "sakura", name: "ซากุระ", species: "CAT", breed: "สก็อตติชโฟลด์ผสม", gender: "FEMALE", ageMonths: 18,
    personality: "ขี้อ้อน เงียบ ชอบนอนหงายท้อง",
    healthNote: "ข้อเท้าหลังแข็งเล็กน้อยตามสายพันธุ์ ต้องเสริมแคลเซียม",
    isVaccinated: true, isUrgent: false, locationFound: "หน้าห้างเซ็นทรัลบางนา เขตบางนา",
    status: "PENDING", images: 4, daysAgo: 40,
  },
  {
    key: "suea", name: "เสือ", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 48,
    personality: "แมวลายสลิด อิสระ ชอบสำรวจ แต่กลับมานอนในบ้านทุกคืน",
    healthNote: "ผลตรวจ FIV เป็นบวก ควรเลี้ยงระบบปิดและแยกจากแมวตัวอื่น",
    isVaccinated: true, isUrgent: true, locationFound: "ท่าเรือคลองสาน เขตคลองสาน",
    status: "AVAILABLE", images: 2, daysAgo: 85,
  },
  {
    key: "latte", name: "ลาเต้", species: "CAT", breed: "ศุภลักษณ์", gender: "MALE", ageMonths: 28,
    personality: "ชอบเดินตามคนไปทุกห้อง ร้องเสียงทุ้ม",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยพหลโยธิน 7 เขตพญาไท",
    status: "ADOPTED", images: 3, daysAgo: 115, adoptedDaysAgo: 90,
  },
  {
    key: "taengmo", name: "แตงโม", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 5,
    personality: "ลูกหมาขี้เล่น ชอบกัดรองเท้า",
    healthNote: "ถ่ายพยาธิแล้ว ฉีดวัคซีนเข็มแรก",
    isVaccinated: false, isUrgent: false, locationFound: "ปั๊มน้ำมันถนนกาญจนาภิเษก เขตบางแค",
    status: "AVAILABLE", images: 3, daysAgo: 15,
  },
  {
    key: "somtam", name: "ส้มตำ", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 5,
    personality: "พี่น้องครอกเดียวกับแตงโม ขี้อายกว่านิดหน่อย",
    healthNote: "ถ่ายพยาธิแล้ว ฉีดวัคซีนเข็มแรก",
    isVaccinated: false, isUrgent: false, locationFound: "ปั๊มน้ำมันถนนกาญจนาภิเษก เขตบางแค",
    status: "AVAILABLE", images: 2, daysAgo: 15,
  },
  {
    key: "mek", name: "เมฆ", species: "CAT", breed: "ขาวมณี", gender: "MALE", ageMonths: 60,
    personality: "สงบ ชอบนอนกลางวัน เข้ากับผู้สูงอายุได้ดี",
    healthNote: "หูขวาไม่ได้ยิน เป็นโรคไตระยะเริ่มต้น ต้องกินอาหารสูตรไต",
    isVaccinated: true, isUrgent: true, locationFound: "ชุมชนวัดสุทัศน์ เขตพระนคร",
    status: "AVAILABLE", images: 2, daysAgo: 100,
  },
  {
    key: "biscuit", name: "บิสกิต", species: "DOG", breed: "บีเกิ้ลผสม", gender: "FEMALE", ageMonths: 34,
    personality: "จมูกไว ชอบดมกลิ่น ขี้เล่นและขี้อ้อน",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยอ่อนนุช 17 เขตสวนหลวง",
    status: "AVAILABLE", images: 4, daysAgo: 30,
  },
  {
    key: "cocoa", name: "โกโก้", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 8,
    personality: "แมวดำตาสีเหลือง ซน ชอบปีนป่าย",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "ซอยอุดมสุข 42 เขตบางนา",
    status: "AVAILABLE", images: 3, daysAgo: 22,
  },
  {
    key: "moodaeng", name: "หมูแดง", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 42,
    personality: "หมาวัด คุ้นกับคนเยอะ ใจเย็น",
    healthNote: "เคยเป็นพยาธิเม็ดเลือดเมื่อปีก่อน รักษาหายแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "วัดสระเกศ เขตป้อมปราบศัตรูพ่าย",
    status: "AVAILABLE", images: 2, daysAgo: 95,
  },
  {
    key: "tato", name: "ตาโต", species: "DOG", breed: "ชิวาวาผสม", gender: "MALE", ageMonths: 20,
    personality: "ตัวเล็กใจใหญ่ เห่าเก่ง ติดเจ้าของมาก",
    healthNote: "พบในสภาพผอมมาก ตอนนี้น้ำหนักเริ่มขึ้น ต้องกินอาหารเม็ดเล็ก",
    isVaccinated: false, isUrgent: true, locationFound: "หน้าห้างเดอะมอลล์บางกะปิ เขตบางกะปิ",
    status: "AVAILABLE", images: 3, daysAgo: 18,
  },
  {
    key: "itim", name: "ไอติม", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 12,
    personality: "แมวขาวส้มขี้อ้อน ชอบให้เกาคาง",
    healthNote: "เคยติดหวัดแมว รักษาหายแล้ว ทำหมันแล้ว",
    isVaccinated: true, isUrgent: false, locationFound: "หอพักนักศึกษาย่านลาดกระบัง เขตลาดกระบัง",
    status: "AVAILABLE", images: 4, daysAgo: 28,
  },
  {
    key: "lucky", name: "ลัคกี้", species: "DOG", breed: "ไซบีเรียนฮัสกี้ผสม", gender: "MALE", ageMonths: 36,
    personality: "ชอบหอนตามเสียงไซเรน ต้องการพื้นที่วิ่งเล่น",
    healthNote: "ไม่ทนอากาศร้อน ควรอยู่บ้านที่มีพื้นที่ร่มและเปิดแอร์ได้",
    isVaccinated: true, isUrgent: false, locationFound: "หมู่บ้านย่านรามอินทรา เขตคันนายาว",
    status: "AVAILABLE", images: 5, daysAgo: 58,
  },
  {
    key: "bamee", name: "บะหมี่", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 6,
    personality: "ลูกแมวลายเสือส้ม กล้าหาญ ไม่กลัวหมา",
    healthNote: "ถ่ายพยาธิแล้ว",
    isVaccinated: false, isUrgent: false, locationFound: "อู่ซ่อมรถ ซอยประชาอุทิศ เขตทุ่งครุ",
    status: "AVAILABLE", images: 2, daysAgo: 14,
  },
  {
    key: "nongfah", name: "น้องฟ้า", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 2,
    personality: "ลูกหมาตาสีฟ้า ขี้อ้อน",
    healthNote: "พบในกล่องข้างถังขยะ ขาดสารอาหาร กำลังฟื้นฟู",
    isVaccinated: false, isUrgent: true, locationFound: "ข้างถังขยะ ซอยเพชรเกษม 48 เขตภาษีเจริญ",
    status: "AVAILABLE", images: 2, daysAgo: 6,
  },
  {
    key: "khanompang", name: "ขนมปัง", species: "OTHER", breed: "กระต่ายฮอลแลนด์ลอป", gender: "FEMALE", ageMonths: 14,
    personality: "ขี้ตกใจกับเสียงดัง แต่ชอบให้ลูบหัว",
    healthNote: "ถูกปล่อยทิ้งในสวนสาธารณะ ฟันปกติ กินหญ้าเก่ง",
    isVaccinated: false, isUrgent: false, locationFound: "สวนจตุจักร เขตจตุจักร",
    status: "ADOPTED", images: 3, daysAgo: 110, adoptedDaysAgo: 85,
  },
  {
    key: "tooptap", name: "ตุ๊บตั๊บ", species: "OTHER", breed: "เต่าแก้มแดง", gender: "UNKNOWN", ageMonths: 48,
    personality: "เชื่องช้า ชอบอาบแดดบนก้อนหิน",
    healthNote: "กระดองมีรอยถลอกเล็กน้อย ต้องการตู้ที่มีไฟ UVB",
    isVaccinated: false, isUrgent: false, locationFound: "บ่อน้ำในสวนรถไฟ เขตจตุจักร",
    status: "AVAILABLE", images: 2, daysAgo: 80,
  },
  {
    key: "thuadaeng", name: "ถั่วแดง", species: "OTHER", breed: "แกสบี้ (หนูตะเภา)", gender: "MALE", ageMonths: 10,
    personality: "ส่งเสียงร้องดีใจทุกครั้งที่ได้ยินเสียงถุงผัก",
    healthNote: "ต้องได้รับวิตามินซีเสริมทุกวัน",
    isVaccinated: false, isUrgent: false, locationFound: "ตลาดนัดจตุจักร โซนสัตว์เลี้ยง เขตจตุจักร",
    status: "PENDING", images: 2, daysAgo: 35,
  },
  {
    key: "hima", name: "หิมะ", species: "OTHER", breed: "กระต่ายไทยพันทาง", gender: "MALE", ageMonths: 8,
    personality: "ชอบกระโดดเล่นตอนเย็น",
    healthNote: "ขาหลังมีแผลถลอก ทายาแล้ว",
    isVaccinated: false, isUrgent: false, locationFound: "หน้าโรงเรียนย่านดอนเมือง เขตดอนเมือง",
    status: "AVAILABLE", images: 2, daysAgo: 26,
  },
  {
    key: "khaijiao", name: "ไข่เจียว", species: "OTHER", breed: "ไก่แจ้", gender: "FEMALE", ageMonths: 12,
    personality: "เดินตามคนเหมือนลูกหมา ชอบคุ้ยดิน",
    healthNote: "แข็งแรงดี ออกไข่ได้",
    isVaccinated: false, isUrgent: false, locationFound: "ชุมชนริมคลองบางกอกน้อย เขตบางกอกน้อย",
    status: "AVAILABLE", images: 1, daysAgo: 44,
  },
];

// ─────────────────────────── Adoption requests ───────────────────────────

export type AdoptionRequestSeed = {
  user: string;
  animal: string;
  housingType: HousingType;
  status: ReviewStatus;
  reason: string;
  daysAgo: number;
};

export const adoptionRequests: AdoptionRequestSeed[] = [
  // ADOPTED animals: exactly one APPROVED request each
  { user: "user1@test.com", animal: "khaotang", housingType: "HOUSE", status: "APPROVED", daysAgo: 150,
    reason: "บ้านมีสนามหญ้ากว้าง เคยเลี้ยงหมามาก่อน และมีคนอยู่บ้านตลอดวัน" },
  { user: "user2@test.com", animal: "som-o", housingType: "CONDO", status: "APPROVED", daysAgo: 138,
    reason: "ทำงานที่บ้านเป็นหลัก คอนโดอนุญาตให้เลี้ยงแมว ติดตาข่ายกันตกที่ระเบียงแล้ว" },
  { user: "user3@test.com", animal: "pudding", housingType: "HOUSE", status: "APPROVED", daysAgo: 128,
    reason: "อยากหาเพื่อนให้แมวที่บ้าน พุดดิ้งเข้ากับแมวได้ดีจึงเหมาะมาก" },
  { user: "user4@test.com", animal: "mali", housingType: "CONDO", status: "APPROVED", daysAgo: 120,
    reason: "เคยเลี้ยงแมววิเชียรมาศมาก่อน เข้าใจนิสัยช่างพูดของสายพันธุ์นี้" },
  { user: "user5@test.com", animal: "bualoi", housingType: "HOUSE", status: "APPROVED", daysAgo: 112,
    reason: "ที่บ้านมีหมาอีกตัวที่ชอบเล่นกับหมาตัวอื่น อยากหาเพื่อนให้" },
  { user: "user1@test.com", animal: "latte", housingType: "HOUSE", status: "APPROVED", daysAgo: 100,
    reason: "รับข้าวตังไปเลี้ยงแล้วประทับใจมาก อยากรับแมวอีกตัวมาอยู่ด้วยกัน" },
  { user: "user3@test.com", animal: "khanompang", housingType: "HOUSE", status: "APPROVED", daysAgo: 95,
    reason: "มีบ้านไม้สำหรับกระต่ายและพื้นที่หญ้าให้วิ่งเล่นในบ้าน" },
  // A rejected request on an adopted animal (someone else was approved)
  { user: "user4@test.com", animal: "khaotang", housingType: "CONDO", status: "REJECTED", daysAgo: 148,
    reason: "ชอบหมาพันธุ์ไทย อยากมีเพื่อนวิ่งออกกำลังกายตอนเช้า" },
  // PENDING animals: at least one PENDING request each
  { user: "user5@test.com", animal: "mochi", housingType: "CONDO", status: "PENDING", daysAgo: 5,
    reason: "คอนโดอนุญาตให้เลี้ยงสัตว์ขนาดเล็ก และมีคนอยู่ห้องเกือบตลอดเวลา" },
  { user: "user2@test.com", animal: "mochi", housingType: "CONDO", status: "PENDING", daysAgo: 3,
    reason: "เคยเลี้ยงปอมเมอเรเนียนมาก่อน รู้วิธีดูแลขนและผิวหนัง" },
  { user: "user4@test.com", animal: "mok", housingType: "CONDO", status: "PENDING", daysAgo: 7,
    reason: "ห้องเงียบ อยู่คนเดียว เหมาะกับแมวที่ไม่ชอบเสียงดัง" },
  { user: "user3@test.com", animal: "taohu", housingType: "HOUSE", status: "PENDING", daysAgo: 4,
    reason: "บ้านอยู่ใกล้มหาวิทยาลัย เห็นเต้าหู้มาตั้งแต่เด็กและผูกพันกันแล้ว" },
  { user: "user1@test.com", animal: "sakura", housingType: "HOUSE", status: "PENDING", daysAgo: 2,
    reason: "มีแมวอยู่แล้วหนึ่งตัวที่นิสัยใจดี และพร้อมดูแลเรื่องข้อต่อตามคำแนะนำของสัตวแพทย์" },
  { user: "user5@test.com", animal: "thuadaeng", housingType: "DORM", status: "PENDING", daysAgo: 6,
    reason: "หอพักอนุญาตให้เลี้ยงสัตว์ในกรง เตรียมกรงและหญ้าไว้แล้ว" },
  // A rejected request on an available animal
  { user: "user2@test.com", animal: "thongyip", housingType: "DORM", status: "REJECTED", daysAgo: 30,
    reason: "อยากมีหมาเป็นเพื่อนระหว่างเรียน" },
];

// ─────────────────────────── Favorites ───────────────────────────

export type FavoriteSeed = { user: string; animal: string };

export const favorites: FavoriteSeed[] = [
  { user: "user1@test.com", animal: "dang" },
  { user: "user1@test.com", animal: "chaokuay" },
  { user: "user1@test.com", animal: "lukkaew" },
  { user: "user2@test.com", animal: "mochi" },
  { user: "user2@test.com", animal: "thongyip" },
  { user: "user2@test.com", animal: "puifai" },
  { user: "user3@test.com", animal: "tato" },
  { user: "user3@test.com", animal: "suea" },
  { user: "user3@test.com", animal: "dang" },
  { user: "user4@test.com", animal: "mok" },
  { user: "user4@test.com", animal: "mek" },
  { user: "user4@test.com", animal: "lucky" },
  { user: "user5@test.com", animal: "nongfah" },
  { user: "user5@test.com", animal: "thungthong" },
  { user: "user5@test.com", animal: "khaotang" },
];

// ─────────────────────────── Animal updates (success stories) ───────────────────────────

export type AnimalUpdateSeed = {
  animal: string;
  author: string;
  caption: string;
  /** Number of placeholder photos (1–4) */
  images: number;
  daysAgo: number;
};

export const animalUpdates: AnimalUpdateSeed[] = [
  { animal: "khaotang", author: "admin@test.com", images: 2, daysAgo: 139,
    caption: "ส่งข้าวตังถึงบ้านใหม่เรียบร้อย ขอบคุณครอบครัวคุณสมชายมากครับ" },
  { animal: "khaotang", author: "user1@test.com", images: 3, daysAgo: 120,
    caption: "ผ่านไป 3 สัปดาห์ ข้าวตังวิ่งเล่นในสนามทุกเช้า ตอนนี้นั่งรอคำสั่งได้แล้ว" },
  { animal: "khaotang", author: "user1@test.com", images: 1, daysAgo: 60,
    caption: "ฉีดวัคซีนกระตุ้นประจำปีเรียบร้อย คุณหมอบอกว่าแข็งแรงมาก" },
  { animal: "khaotang", author: "user1@test.com", images: 4, daysAgo: 10,
    caption: "ครบ 4 เดือนที่บ้านใหม่ ข้าวตังกลายเป็นหัวหน้าแก๊งของบ้านไปแล้ว" },

  { animal: "som-o", author: "admin@test.com", images: 1, daysAgo: 129,
    caption: "ส้มโอได้บ้านแล้ว! ครอบครัวใหม่เตรียมห้องไว้ให้อย่างดี" },
  { animal: "som-o", author: "user2@test.com", images: 2, daysAgo: 100,
    caption: "ส้มโอยึดโซฟาเรียบร้อย ชอบนอนตักตอนทำงานที่บ้าน" },
  { animal: "som-o", author: "user2@test.com", images: 3, daysAgo: 30,
    caption: "ซื้อคอนโดแมวใหม่ให้ ปีนขึ้นชั้นบนสุดทันที" },

  { animal: "pudding", author: "user3@test.com", images: 2, daysAgo: 110,
    caption: "วันแรกที่บ้าน พุดดิ้งยังเขินอยู่ แต่กินข้าวหมดชาม" },
  { animal: "pudding", author: "admin@test.com", images: 3, daysAgo: 70,
    caption: "ทีมงานไปเยี่ยมบ้าน พุดดิ้งน้ำหนักขึ้นและขนสวยมาก" },

  { animal: "mali", author: "user4@test.com", images: 2, daysAgo: 105,
    caption: "มะลิร้องทักทายทุกเช้าเหมือนเดิม ตอนนี้ชอบนั่งดูนกที่ระเบียง" },
  { animal: "mali", author: "user4@test.com", images: 1, daysAgo: 45,
    caption: "พามะลิไปตรวจสุขภาพประจำปี ผลเลือดปกติดี" },
  { animal: "mali", author: "admin@test.com", images: 2, daysAgo: 20,
    caption: "ขอบคุณที่ส่งรูปอัปเดตมาเรื่อย ๆ นะคะ มะลิดูมีความสุขมาก" },

  { animal: "bualoi", author: "admin@test.com", images: 2, daysAgo: 99,
    caption: "บัวลอยออกเดินทางไปบ้านใหม่แล้ว มีพี่หมาอีกตัวรอเล่นด้วย" },
  { animal: "bualoi", author: "user5@test.com", images: 4, daysAgo: 75,
    caption: "บัวลอยกับพี่โบ้เล่นกันทั้งวัน นอนกอดกันตอนกลางคืน" },
  { animal: "bualoi", author: "user5@test.com", images: 3, daysAgo: 15,
    caption: "พาไปเที่ยวทะเลครั้งแรก วิ่งไล่คลื่นสนุกมาก" },

  { animal: "latte", author: "user1@test.com", images: 1, daysAgo: 85,
    caption: "ลาเต้เดินสำรวจบ้านทุกห้อง แล้วเลือกนอนบนเตียงเจ้าของ" },
  { animal: "latte", author: "user1@test.com", images: 2, daysAgo: 40,
    caption: "ลาเต้กับข้าวตังเริ่มเป็นเพื่อนกันแล้ว นอนข้างกันได้" },
  { animal: "latte", author: "admin@test.com", images: 1, daysAgo: 25,
    caption: "เรื่องราวของลาเต้และข้าวตังคือสิ่งที่เราอยากเห็นที่สุด ขอบคุณครับ" },

  { animal: "khanompang", author: "user3@test.com", images: 2, daysAgo: 80,
    caption: "ขนมปังมีบ้านไม้หลังใหม่ ชอบกระโดดดีใจตอนเย็น" },
  { animal: "khanompang", author: "user3@test.com", images: 1, daysAgo: 35,
    caption: "ขนมปังกินหญ้าทิโมธีเก่งมาก น้ำหนักกำลังดี" },
];

// ─────────────────────────── Community reports ───────────────────────────

export type ReportSeed = {
  user: string;
  species: Species;
  breed: string | null;
  location: string;
  description: string;
  status: ReviewStatus;
  /** Only for APPROVED reports: the animal listing created from this report */
  animal?: string;
  /** Number of placeholder photos (1–3) */
  images: number;
  daysAgo: number;
};

export const reports: ReportSeed[] = [
  { user: "user2@test.com", species: "DOG", breed: "ไทยพันทาง", location: "ปากซอยรามคำแหง 24 เขตบางกะปิ",
    description: "พบหมาขาหน้าขวาบาดเจ็บ เดินไม่ได้ นอนอยู่ข้างร้านสะดวกซื้อ ดูเหมือนถูกรถเฉี่ยว",
    status: "APPROVED", animal: "dang", images: 3, daysAgo: 14 },
  { user: "user4@test.com", species: "CAT", breed: "แมวไทยพันทาง", location: "ตลาดห้วยขวาง เขตห้วยขวาง",
    description: "ได้ยินเสียงลูกแมวร้องในกองลังหลังแผงผัก ไม่เห็นแม่แมวกลับมาหลายชั่วโมงแล้ว",
    status: "APPROVED", animal: "lukkaew", images: 2, daysAgo: 9 },
  { user: "user1@test.com", species: "DOG", breed: "ชิวาวาผสม", location: "หน้าห้างเดอะมอลล์บางกะปิ เขตบางกะปิ",
    description: "หมาตัวเล็กผอมมาก เดินวนอยู่หน้าห้างหลายวัน น่าจะถูกทิ้ง มีปลอกคอแต่ไม่มีป้ายชื่อ",
    status: "APPROVED", animal: "tato", images: 3, daysAgo: 20 },
  { user: "user3@test.com", species: "CAT", breed: null, location: "ลานจอดรถคอนโดย่านรัชดา เขตห้วยขวาง",
    description: "แม่แมวกับลูก 4 ตัวอาศัยอยู่ใต้รถ นิติบุคคลกำลังจะไล่ออก",
    status: "PENDING", images: 2, daysAgo: 3 },
  { user: "user5@test.com", species: "DOG", breed: "ไทยหลังอาน", location: "ริมถนนวิภาวดีรังสิต เขตดอนเมือง",
    description: "หมามีแผลเปิดที่หลัง มีแมลงวันตอม ต้องการความช่วยเหลือด่วน",
    status: "PENDING", images: 3, daysAgo: 1 },
  { user: "user1@test.com", species: "OTHER", breed: null, location: "ซอยพัฒนาการ 30 เขตสวนหลวง",
    description: "เต่าบกขนาดใหญ่เดินอยู่กลางซอย คาดว่าหลุดมาจากบ้านใกล้เคียง",
    status: "PENDING", images: 1, daysAgo: 2 },
  { user: "user2@test.com", species: "DOG", breed: null, location: "สวนหลวง ร.9 เขตประเวศ",
    description: "เห็นหมาเดินอยู่ตัวเดียวในสวน ไม่แน่ใจว่ามีเจ้าของหรือไม่ (ตรวจสอบแล้วมีเจ้าของ)",
    status: "REJECTED", images: 1, daysAgo: 40 },
  { user: "user4@test.com", species: "CAT", breed: "แมวไทยพันทาง", location: "ตลาดห้วยขวาง เขตห้วยขวาง",
    description: "ลูกแมวร้องอยู่หลังแผงผัก (รายงานซ้ำกับรายการที่อนุมัติแล้ว)",
    status: "REJECTED", images: 2, daysAgo: 9 },
];

// ─────────────────────────── Donations ───────────────────────────

export type DonationPackageSeed = { key: string; name: string; description: string; price: number; icon: string };

export const donationPackages: DonationPackageSeed[] = [
  { key: "food", name: "ค่าอาหาร 1 สัปดาห์", price: 100, icon: "🍖",
    description: "อาหารเม็ดและอาหารเปียกสำหรับน้องหมาหรือน้องแมว 1 ตัว นาน 1 สัปดาห์" },
  { key: "litter", name: "ทรายแมวและของใช้", price: 200, icon: "🧺",
    description: "ทรายแมว กระบะทราย และของใช้จำเป็นสำหรับบ้านพักชั่วคราว" },
  { key: "vaccine", name: "ค่าวัคซีน", price: 300, icon: "💉",
    description: "วัคซีนรวมหรือวัคซีนพิษสุนัขบ้า 1 เข็ม" },
  { key: "medicine", name: "ค่ายาและเวชภัณฑ์", price: 500, icon: "💊",
    description: "ยาถ่ายพยาธิ ยาหยอดเห็บหมัด และยาทาแผล" },
  { key: "emergency", name: "ค่ารักษาฉุกเฉิน", price: 1000, icon: "🚑",
    description: "สมทบค่ารักษาสัตว์ที่ประสบอุบัติเหตุหรือป่วยหนัก" },
  { key: "sterilization", name: "ค่าทำหมัน", price: 1500, icon: "🏥",
    description: "ผ่าตัดทำหมัน 1 ตัว ช่วยลดจำนวนสัตว์จรในชุมชนอย่างยั่งยืน" },
];

export type DonationSeed = {
  user: string;
  status: DonationStatus;
  daysAgo: number;
  items: { package: string; quantity: number }[];
};

export const donations: DonationSeed[] = [
  { user: "user1@test.com", status: "CONFIRMED", daysAgo: 60,
    items: [{ package: "food", quantity: 3 }, { package: "vaccine", quantity: 1 }] },
  { user: "user2@test.com", status: "CONFIRMED", daysAgo: 45,
    items: [{ package: "sterilization", quantity: 1 }] },
  { user: "user4@test.com", status: "CONFIRMED", daysAgo: 20,
    items: [{ package: "emergency", quantity: 1 }, { package: "vaccine", quantity: 2 }] },
  { user: "user3@test.com", status: "PENDING", daysAgo: 2,
    items: [{ package: "medicine", quantity: 2 }, { package: "food", quantity: 5 }] },
  { user: "user5@test.com", status: "PENDING", daysAgo: 1,
    items: [{ package: "litter", quantity: 1 }, { package: "food", quantity: 2 }] },
];
