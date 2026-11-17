import type {
  AnimalStatus,
  DonationStatus,
  Gender,
  HousingType,
  ReviewStatus,
  Role,
  Species,
} from "@prisma/client";
import type { Province } from "../src/lib/provinces";

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
  /** 1–8 short tags */
  personality: string[];
  description: string;
  /** Health history, one entry per line */
  healthNote: string;
  isVaccinated: boolean;
  isSterilized: boolean;
  isUrgent: boolean;
  locationFound: string;
  province: Province;
  status: AnimalStatus;
  /**
   * 1–5 photo links, the first one is the cover. Currently Wikimedia Commons photos (credits in
   * photo-credits.md); any public image URL works, e.g. from your Supabase bucket via POST /api/uploads.
   * Check them with `npm run photos:preview`.
   */
  imageUrls: string[];
  daysAgo: number;
  /** Only for ADOPTED animals */
  adoptedDaysAgo?: number;
};

export const animals: AnimalSeed[] = [
  {
    key: "khaotang", name: "ข้าวตัง", species: "DOG", breed: "ไทยหลังอาน", gender: "MALE", ageMonths: 18,
    personality: ["ร่าเริง", "ขี้เล่น", "ชอบวิ่งเล่น", "เข้ากับเด็กได้ดี"],
    description: "ข้าวตังถูกพบวิ่งเล่นอยู่ในซอยลาดพร้าว 101 เป็นหมาพลังเยอะที่ชอบวิ่งในสนามและเข้ากับเด็กได้ดีมาก",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว สุขภาพแข็งแรง",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยลาดพร้าว 101 เขตบางกะปิ", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 160, adoptedDaysAgo: 140,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Red_Thai_Ridgeback.jpg/960px-Red_Thai_Ridgeback.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Red_Thai_Ridgeback_2.jpg/960px-Red_Thai_Ridgeback_2.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e5/Red_Thai_Ridgeback_3.jpg/960px-Red_Thai_Ridgeback_3.jpg",
    ],
  },
  {
    key: "som-o", name: "ส้มโอ", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 14,
    personality: ["ขี้อ้อน", "ชอบนอนตัก", "ชอบเล่นไม้ตกแมว"],
    description: "ส้มโออาศัยอยู่แถวร้านข้าวมันไก่ในซอยอารีย์ เป็นแมวส้มที่ขี้อ้อนและชอบนอนตักทุกครั้งที่มีโอกาส",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ร้านข้าวมันไก่ ซอยอารีย์ เขตพญาไท", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 150, adoptedDaysAgo: 130,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/Orange_Cat_at_MCS_Building.jpg/960px-Orange_Cat_at_MCS_Building.jpg",
    ],
  },
  {
    key: "khanompang", name: "ขนมปัง", species: "OTHER", breed: "กระต่ายฮอลแลนด์ลอป", gender: "FEMALE", ageMonths: 14,
    personality: ["ขี้ตกใจ", "ชอบให้ลูบหัว"],
    description: "ขนมปังถูกปล่อยทิ้งไว้ในสวนจตุจักร ช่วงแรกตกใจง่ายกับเสียงดัง แต่ถ้าคุ้นเคยแล้วจะชอบให้ลูบหัวมาก",
    healthNote: "ถูกปล่อยทิ้งในสวนสาธารณะ ฟันปกติ กินหญ้าเก่ง",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "สวนจตุจักร เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 110, adoptedDaysAgo: 85,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/Baby_Holland_Lop_1.png/960px-Baby_Holland_Lop_1.png",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/92/Baby_Holland_Lop_2.png/960px-Baby_Holland_Lop_2.png",
    ],
  },
  {
    key: "mochi", name: "โมจิ", species: "DOG", breed: "ปอมเมอเรเนียนผสม", gender: "FEMALE", ageMonths: 24,
    personality: ["ขี้อ้อน", "ติดคน", "ชอบให้อุ้ม"],
    description: "โมจิถูกทิ้งไว้หน้าคอนโดย่านอ่อนนุช เป็นหมาตัวเล็กที่ติดคนมาก ชอบให้อุ้ม และจะเห่าเสียงแหลมเวลาตื่นเต้น",
    healthNote: "ถูกทิ้งหน้าคอนโด ขนร่วงจากความเครียด ตอนนี้ขนเริ่มขึ้นแล้ว",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "หน้าคอนโดย่านอ่อนนุช เขตสวนหลวง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 75,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bc/21Pom.jpg/960px-21Pom.jpg",
    ],
  },
  {
    key: "mok", name: "หมอก", species: "CAT", breed: "โคราช (สีสวาด)", gender: "MALE", ageMonths: 20,
    personality: ["สุขุม", "ชอบความเงียบ"],
    description: "หมอกเป็นแมวสีสวาดที่อาศัยอยู่ในวัดพระศรีมหาธาตุ นิสัยสุขุม ชอบอยู่เงียบ ๆ เหมาะกับบ้านที่ไม่มีเสียงดัง",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "วัดพระศรีมหาธาตุ เขตบางเขน", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 60,
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/c/c1/Veda%2Cchat-adulte-m%C3%A2le-race-korat.JPG",
    ],
  },
  {
    key: "dang", name: "ด่าง", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 30,
    personality: ["ขี้กลัวคนแปลกหน้า", "ติดคนเมื่อคุ้นเคย"],
    description: "ด่างถูกรถเฉี่ยวที่ปากซอยรามคำแหง 24 ช่วงแรกจะกลัวคนแปลกหน้า แต่เมื่อคุ้นเคยแล้วจะติดคนมาก ตอนนี้กำลังพักฟื้นหลังผ่าตัดขา",
    healthNote: "ถูกรถเฉี่ยว ขาหน้าขวาเพิ่งผ่าตัดใส่เหล็ก ต้องการบ้านที่ดูแลใกล้ชิด",
    isVaccinated: false, isSterilized: false, isUrgent: true,
    locationFound: "ปากซอยรามคำแหง 24 เขตบางกะปิ", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 12,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/Stray_dog_black_and_white.jpg/960px-Stray_dog_black_and_white.jpg",
    ],
  },
  {
    key: "lukkaew", name: "ลูกแก้ว", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 1,
    personality: ["ตัวเล็ก", "ขี้อ้อน"],
    description: "ลูกแก้วถูกพบในกองลังหลังแผงผักในตลาดห้วยขวางตอนอายุราว 3 สัปดาห์ ยังต้องป้อนนมและดูแลใกล้ชิด",
    healthNote: "พบตอนอายุราว 3 สัปดาห์ ต้องป้อนนมทุก 3-4 ชั่วโมง",
    isVaccinated: false, isSterilized: false, isUrgent: true,
    locationFound: "ตลาดห้วยขวาง เขตห้วยขวาง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 8,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fe/Black_Spotted_Tabby_Kitten-Supine-Thailand.jpg/960px-Black_Spotted_Tabby_Kitten-Supine-Thailand.jpg",
    ],
  },
  {
    key: "thongyip", name: "ทองหยิบ", species: "DOG", breed: "โกลเด้นรีทรีฟเวอร์ผสม", gender: "MALE", ageMonths: 15,
    personality: ["พลังเยอะ", "ชอบเล่นน้ำ", "ชอบคาบของ"],
    description: "ทองหยิบถูกพบริมคลองแสนแสบ เป็นหมาพลังเยอะที่ชอบเล่นน้ำและชอบคาบของมาให้คนเล่นด้วย",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ริมคลองแสนแสบ เขตวังทองหลาง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 55,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/3052-Golden-Retriever-2_%2820505649281%29.jpg/960px-3052-Golden-Retriever-2_%2820505649281%29.jpg",
    ],
  },
  {
    key: "nomsod", name: "นมสด", species: "CAT", breed: "ขาวมณี", gender: "FEMALE", ageMonths: 10,
    personality: ["เรียบร้อย", "ขี้เกรงใจ", "ชอบนั่งริมหน้าต่าง"],
    description: "นมสดเป็นแมวขาวมณีตาสองสีที่ถูกพบในซอยงามวงศ์วาน นิสัยเรียบร้อยและขี้เกรงใจ ชอบนั่งดูวิวริมหน้าต่าง",
    healthNote: "ตาสองสี หูได้ยินปกติ ทำหมันแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยงามวงศ์วาน 23 อำเภอเมืองนนทบุรี", province: "นนทบุรี",
    status: "AVAILABLE", daysAgo: 45,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Khao_Manee_%22Leela%22.jpg/960px-Khao_Manee_%22Leela%22.jpg",
    ],
  },
  {
    key: "tooptap", name: "ตุ๊บตั๊บ", species: "OTHER", breed: "เต่าแก้มแดง", gender: "UNKNOWN", ageMonths: 48,
    personality: ["เชื่องช้า", "ชอบอาบแดด"],
    description: "ตุ๊บตั๊บเป็นเต่าแก้มแดงที่ถูกปล่อยในบ่อน้ำสวนรถไฟ ชอบขึ้นมาอาบแดดบนก้อนหิน ต้องการตู้เลี้ยงที่มีไฟ UVB",
    healthNote: "กระดองมีรอยถลอกเล็กน้อย ต้องการตู้ที่มีไฟ UVB",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "บ่อน้ำในสวนรถไฟ เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 80,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/2018-06-16_Aradosee_Rotwangen-Schmuckschildkr%C3%B6te.jpg/960px-2018-06-16_Aradosee_Rotwangen-Schmuckschildkr%C3%B6te.jpg",
    ],
  },
  {
    key: "makham", name: "มะขาม", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 36,
    personality: ["ใจดี", "นิ่ง ๆ", "เดินสายจูงเก่ง"],
    description: "มะขามเป็นหมาประจำตลาดนัดจตุจักร นิสัยใจดีและนิ่ง ชอบนอนอาบแดด เดินสายจูงได้เก่ง",
    healthNote: "ทำหมันแล้ว มีโรคผิวหนังเล็กน้อย กำลังรักษาด้วยยาทา",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ตลาดนัดจตุจักร เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 120,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Dog_sand.png/960px-Dog_sand.png",
    ],
  },
  {
    key: "jaodam", name: "เจ้าดำ", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 60,
    personality: ["สุขุม", "รักเจ้าของ", "เฝ้าบ้านเก่ง"],
    description: "เจ้าดำอาศัยอยู่ใต้สะพานพระราม 8 มาหลายปี เป็นหมาสูงวัยที่สุขุม เฝ้าบ้านเก่งแต่ไม่ดุ",
    healthNote: "ขาหลังซ้ายเคยหัก เดินกะเผลกเล็กน้อยแต่ไม่เจ็บแล้ว",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "ใต้สะพานพระราม 8 เขตบางพลัด", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 200,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Blackthai.jpg/960px-Blackthai.jpg",
    ],
  },
  {
    key: "thungthong", name: "ถุงทอง", species: "DOG", breed: "ไทยบางแก้วผสม", gender: "MALE", ageMonths: 6,
    personality: ["ซุกซน", "ช่างสงสัย", "เรียนรู้ไว"],
    description: "ถุงทองเป็นลูกหมาที่ถูกพบหน้าวัดบางพลีใหญ่ ซุกซนและช่างสงสัย กำลังหัดนั่งและรอคำสั่ง",
    healthNote: "ฉีดวัคซีนเข็มแรกแล้ว รอเข็มกระตุ้นสัปดาห์หน้า",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "หน้าวัดบางพลีใหญ่ อำเภอบางพลี", province: "สมุทรปราการ",
    status: "AVAILABLE", daysAgo: 20,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/BangBon_Bangkok_28.10.2017_%2846%29.jpg/960px-BangBon_Bangkok_28.10.2017_%2846%29.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8d/BangBon_Bangkok_28.10.2017_%2845%29.jpg/960px-BangBon_Bangkok_28.10.2017_%2845%29.jpg",
    ],
  },
  {
    key: "pudding", name: "พุดดิ้ง", species: "DOG", breed: "พุดเดิ้ลผสม", gender: "FEMALE", ageMonths: 40,
    personality: ["อ่อนโยน", "ชอบให้แปรงขน", "เข้ากับแมวได้"],
    description: "พุดดิ้งถูกพบในหมู่บ้านเสนานิเวศน์ เป็นหมาอ่อนโยนที่ชอบให้แปรงขนและอยู่ร่วมกับแมวได้",
    healthNote: "ทำหมันแล้ว ฟันเริ่มมีหินปูน",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "หมู่บ้านเสนานิเวศน์ เขตลาดพร้าว", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 140, adoptedDaysAgo: 118,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Bell_Gold_Poodle.jpg/960px-Bell_Gold_Poodle.jpg",
    ],
  },
  {
    key: "chaokuay", name: "เฉาก๊วย", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 84,
    personality: ["สูงวัย", "ใจดี", "ชอบเดินเล่นช้า ๆ"],
    description: "เฉาก๊วยเป็นหมาสูงวัยที่อาศัยอยู่ในสวนลุมพินี ใจดีและชอบเดินเล่นช้า ๆ ตอนเย็น ต้องการบ้านที่ดูแลเรื่องสุขภาพ",
    healthNote: "มีต้อกระจกตาซ้าย ต้องกินยาบำรุงข้อทุกวัน",
    isVaccinated: true, isSterilized: false, isUrgent: true,
    locationFound: "สวนลุมพินี เขตปทุมวัน", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 90,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Wat_Ming_Mueang_dog.jpg/960px-Wat_Ming_Mueang_dog.jpg",
    ],
  },
  {
    key: "mali", name: "มะลิ", species: "CAT", breed: "วิเชียรมาศ", gender: "FEMALE", ageMonths: 26,
    personality: ["ช่างพูด", "ติดเจ้าของ"],
    description: "มะลิเป็นแมววิเชียรมาศที่ช่างพูดมาก ร้องทักทายทุกครั้งที่เจอคนและติดเจ้าของสุด ๆ",
    healthNote: "ทำหมันแล้ว ฉีดวัคซีนครบ",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยประชาราษฎร์บำเพ็ญ เขตห้วยขวาง", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 130, adoptedDaysAgo: 110,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Wichien-maat-momo.jpg/960px-Wichien-maat-momo.jpg",
    ],
  },
  {
    key: "khanun", name: "ขนุน", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 30,
    personality: ["นักเลง", "ขี้อ้อน"],
    description: "ขนุนเป็นแมวส้มคุมซอยแถวถนนข้าวสาร ดูเป็นนักเลงกับแมวตัวอื่นแต่ขี้อ้อนกับคนมาก",
    healthNote: "หูขวามีรอยแหว่งจากการต่อสู้ ทำหมันแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ถนนข้าวสาร เขตพระนคร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 70,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244633188%29.jpg/960px-Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244633188%29.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/34/Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244619684%29.jpg/960px-Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244619684%29.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/61/Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244612588%29.jpg/960px-Thanon_Khao_San%2C_Bangkok%2C_Thailand_%284244612588%29.jpg",
    ],
  },
  {
    key: "taohu", name: "เต้าหู้", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 12,
    personality: ["เรียบร้อย", "ขี้อาย"],
    description: "เต้าหู้เป็นหมาขาวที่อาศัยอยู่หน้ามหาวิทยาลัยเกษตรศาสตร์ ขี้อายในช่วงแรก แต่จะเดินตามคนที่ไว้ใจ",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "หน้ามหาวิทยาลัยเกษตรศาสตร์ เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 50,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/DOG_THAI_WHITE.jpg/960px-DOG_THAI_WHITE.jpg",
    ],
  },
  {
    key: "chocolate", name: "ช็อกโกแลต", species: "DOG", breed: "ลาบราดอร์ผสม", gender: "MALE", ageMonths: 26,
    personality: ["เป็นมิตร", "ชอบกิน"],
    description: "ช็อกโกแลตเป็นมิตรกับทุกคนและชอบกินเป็นชีวิตจิตใจ ตอนนี้กำลังคุมอาหารเพื่อลดน้ำหนัก",
    healthNote: "น้ำหนักเกินเล็กน้อย กำลังคุมอาหาร",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "ซอยรัชดาภิเษก 36 เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 40,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/BoraDK20050369.JPG/960px-BoraDK20050369.JPG",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/BoraDK20050331.JPG/960px-BoraDK20050331.JPG",
    ],
  },
  {
    key: "puifai", name: "ปุยฝ้าย", species: "CAT", breed: "เปอร์เซียผสม", gender: "FEMALE", ageMonths: 36,
    personality: ["ชอบนอนโซฟา", "ไม่ชอบให้อุ้มนาน"],
    description: "ปุยฝ้ายเป็นแมวขนยาวที่ถูกทิ้งไว้ในคอนโดย่านพระราม 9 ชอบนอนบนโซฟา และต้องการคนแปรงขนให้ทุกวัน",
    healthNote: "ขนยาวต้องแปรงทุกวัน มีน้ำตาไหลเล็กน้อย",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "คอนโดย่านพระราม 9 เขตห้วยขวาง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 65,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/90/Persian_Cat_from_Kerala_01.jpg/960px-Persian_Cat_from_Kerala_01.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Persian_Cat_from_Kerala_02.jpg/960px-Persian_Cat_from_Kerala_02.jpg",
    ],
  },
  {
    key: "sakura", name: "ซากุระ", species: "CAT", breed: "สก็อตติชโฟลด์ผสม", gender: "FEMALE", ageMonths: 18,
    personality: ["ขี้อ้อน", "เงียบ", "ชอบนอนหงายท้อง"],
    description: "ซากุระเป็นแมวหูพับที่ขี้อ้อนและเงียบ ชอบนอนหงายท้อง ต้องดูแลเรื่องข้อต่อตามสายพันธุ์",
    healthNote: "ข้อเท้าหลังแข็งเล็กน้อยตามสายพันธุ์ ต้องเสริมแคลเซียม",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "หน้าห้างเซ็นทรัลบางนา เขตบางนา", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 40,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Scottishfold-blue-yae2.jpg/960px-Scottishfold-blue-yae2.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Scottishfold-blue-yae.jpg/960px-Scottishfold-blue-yae.jpg",
    ],
  },
  {
    key: "suea", name: "เสือ", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 48,
    personality: ["อิสระ", "ชอบสำรวจ"],
    description: "เสือเป็นแมวลายสลิดที่ชอบสำรวจไปทั่วย่านเมืองเก่าภูเก็ต ผลตรวจ FIV เป็นบวกจึงต้องเลี้ยงระบบปิด",
    healthNote: "ผลตรวจ FIV เป็นบวก ควรเลี้ยงระบบปิดและแยกจากแมวตัวอื่น",
    isVaccinated: true, isSterilized: false, isUrgent: true,
    locationFound: "ย่านเมืองเก่า อำเภอเมืองภูเก็ต", province: "ภูเก็ต",
    status: "AVAILABLE", daysAgo: 85,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/A_stray_cat_in_Phuket_City%2C_Thaland.jpg/960px-A_stray_cat_in_Phuket_City%2C_Thaland.jpg",
    ],
  },
  {
    key: "latte", name: "ลาเต้", species: "CAT", breed: "ศุภลักษณ์", gender: "MALE", ageMonths: 28,
    personality: ["ติดคน", "ร้องเสียงทุ้ม"],
    description: "ลาเต้เป็นแมวศุภลักษณ์ที่ชอบเดินตามคนไปทุกห้อง ร้องเสียงทุ้มน่ารัก",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยพหลโยธิน 7 เขตพญาไท", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 115, adoptedDaysAgo: 90,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/SuphalakAyodia.jpg/960px-SuphalakAyodia.jpg",
    ],
  },
  {
    key: "mek", name: "เมฆ", species: "CAT", breed: "ขาวมณี", gender: "MALE", ageMonths: 60,
    personality: ["สงบ", "ชอบนอนกลางวัน", "เข้ากับผู้สูงอายุ"],
    description: "เมฆเป็นแมวขาวสูงวัยในชุมชนวัดสุทัศน์ นิสัยสงบ เหมาะกับบ้านที่มีผู้สูงอายุ แต่ต้องกินอาหารสูตรโรคไต",
    healthNote: "หูขวาไม่ได้ยิน เป็นโรคไตระยะเริ่มต้น ต้องกินอาหารสูตรไต",
    isVaccinated: true, isSterilized: false, isUrgent: true,
    locationFound: "ชุมชนวัดสุทัศน์ เขตพระนคร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 100,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2b/Khaomanee_cat.jpg/960px-Khaomanee_cat.jpg",
    ],
  },
  {
    key: "biscuit", name: "บิสกิต", species: "DOG", breed: "บีเกิ้ลผสม", gender: "FEMALE", ageMonths: 34,
    personality: ["จมูกไว", "ขี้เล่น", "ขี้อ้อน"],
    description: "บิสกิตถูกพบวิ่งเล่นอยู่บนชายหาดชะอำ จมูกไว ชอบดมกลิ่นทุกอย่าง ขี้เล่นและขี้อ้อน",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ชายหาดชะอำ อำเภอชะอำ", province: "เพชรบุรี",
    status: "AVAILABLE", daysAgo: 30,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/A_beagle_at_Cha-Am_Beach_02.jpg/960px-A_beagle_at_Cha-Am_Beach_02.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/A_beagle_at_Cha-Am_Beach_15.jpg/960px-A_beagle_at_Cha-Am_Beach_15.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/A_beagle_at_Cha-Am_Beach_19.jpg/960px-A_beagle_at_Cha-Am_Beach_19.jpg",
    ],
  },
  {
    key: "tato", name: "ตาโต", species: "DOG", breed: "ชิวาวาผสม", gender: "MALE", ageMonths: 20,
    personality: ["ตัวเล็กใจใหญ่", "เห่าเก่ง", "ติดเจ้าของ"],
    description: "ตาโตเดินวนอยู่หน้าห้างเดอะมอลล์บางกะปิหลายวันในสภาพผอมมาก ตัวเล็กแต่ใจใหญ่ เห่าเก่งและติดเจ้าของ",
    healthNote: "พบในสภาพผอมมาก ตอนนี้น้ำหนักเริ่มขึ้น ต้องกินอาหารเม็ดเล็ก",
    isVaccinated: false, isSterilized: false, isUrgent: true,
    locationFound: "หน้าห้างเดอะมอลล์บางกะปิ เขตบางกะปิ", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 18,
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/3/30/1791588524950_chihuahua.jpg",
    ],
  },
  {
    key: "lucky", name: "ลัคกี้", species: "DOG", breed: "ไซบีเรียนฮัสกี้ผสม", gender: "MALE", ageMonths: 36,
    personality: ["ชอบหอน", "ต้องการพื้นที่วิ่ง"],
    description: "ลัคกี้เป็นหมาลูกผสมฮัสกี้ที่ชอบหอนตามเสียงไซเรน ต้องการบ้านที่มีพื้นที่วิ่งเล่นและอากาศไม่ร้อนเกินไป",
    healthNote: "ไม่ทนอากาศร้อน ควรอยู่บ้านที่มีพื้นที่ร่มและเปิดแอร์ได้",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "หมู่บ้านย่านลำลูกกา อำเภอลำลูกกา", province: "ปทุมธานี",
    status: "AVAILABLE", daysAgo: 58,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/3217-siberian-husky-dog_%2820314366700%29.jpg/960px-3217-siberian-husky-dog_%2820314366700%29.jpg",
    ],
  },
  {
    key: "nongfah", name: "น้องฟ้า", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 2,
    personality: ["ลูกหมา", "ขี้อ้อน", "ซุกซน"],
    description: "น้องฟ้าถูกพบในกล่องข้างถังขยะ ซอยเพชรเกษม 48 ตอนนี้กำลังฟื้นฟูจากภาวะขาดสารอาหาร ชอบมุดตามช่อง",
    healthNote: "พบในกล่องข้างถังขยะ ขาดสารอาหาร กำลังฟื้นฟู",
    isVaccinated: false, isSterilized: false, isUrgent: true,
    locationFound: "ข้างถังขยะ ซอยเพชรเกษม 48 เขตภาษีเจริญ", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 6,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a3/Puppy_reaching_through_a_grate.jpg/960px-Puppy_reaching_through_a_grate.jpg",
    ],
  },
  {
    key: "hima", name: "หิมะ", species: "OTHER", breed: "กระต่ายไทยพันทาง", gender: "MALE", ageMonths: 8,
    personality: ["ขี้เล่น", "ชอบกระโดด"],
    description: "หิมะเป็นกระต่ายขาวที่ถูกทิ้งหน้าโรงเรียนย่านดอนเมือง ชอบกระโดดเล่นตอนเย็น",
    healthNote: "ขาหลังมีแผลถลอก ทายาแล้ว",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "หน้าโรงเรียนย่านดอนเมือง เขตดอนเมือง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 26,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Conejo_en_el_pasto.JPG/960px-Conejo_en_el_pasto.JPG",
    ],
  },
  {
    key: "thuadaeng", name: "ถั่วแดง", species: "OTHER", breed: "แกสบี้ (หนูตะเภา)", gender: "MALE", ageMonths: 10,
    personality: ["ช่างส่งเสียง", "ชอบกินผัก"],
    description: "ถั่วแดงเป็นแกสบี้ที่ถูกทิ้งในตลาดนัดจตุจักร ส่งเสียงร้องดีใจทุกครั้งที่ได้ยินเสียงถุงผัก",
    healthNote: "ต้องได้รับวิตามินซีเสริมทุกวัน",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "ตลาดนัดจตุจักร โซนสัตว์เลี้ยง เขตจตุจักร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 35,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/An_orange_American_guinea_pig.jpg/960px-An_orange_American_guinea_pig.jpg",
    ],
  },
  {
    key: "bualoi", name: "บัวลอย", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 22,
    personality: ["ร่าเริง", "ชอบเล่นกับหมาตัวอื่น"],
    description: "บัวลอยเคยอยู่ในชุมชนริมทางรถไฟมักกะสัน นิสัยร่าเริงและชอบเล่นกับหมาตัวอื่น",
    healthNote: "ทำหมันแล้ว แข็งแรงดี",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ชุมชนริมทางรถไฟมักกะสัน เขตราชเทวี", province: "กรุงเทพมหานคร",
    status: "ADOPTED", daysAgo: 125, adoptedDaysAgo: 100,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/2_dogs%2C_one_sitting%2C_one_standing.jpg/960px-2_dogs%2C_one_sitting%2C_one_standing.jpg",
    ],
  },
  {
    key: "moodaeng", name: "หมูแดง", species: "DOG", breed: "ไทยพันทาง", gender: "MALE", ageMonths: 42,
    personality: ["หมาวัด", "ใจเย็น", "คุ้นกับคน"],
    description: "หมูแดงเป็นหมาประจำวัดพระสิงห์ที่เชียงใหม่ คุ้นเคยกับคนเยอะและใจเย็นมาก",
    healthNote: "เคยเป็นพยาธิเม็ดเลือดเมื่อปีก่อน รักษาหายแล้ว",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "วัดพระสิงห์ อำเภอเมืองเชียงใหม่", province: "เชียงใหม่",
    status: "AVAILABLE", daysAgo: 95,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b9/Wat_Phra_Singh_dog_-_Chiang_Mai.jpg/960px-Wat_Phra_Singh_dog_-_Chiang_Mai.jpg",
    ],
  },
  {
    key: "toob", name: "ตูบ", species: "DOG", breed: "ไทยหลังอาน", gender: "MALE", ageMonths: 9,
    personality: ["ขี้เล่น", "ซื่อสัตย์", "เรียนรู้ไว"],
    description: "ตูบเป็นหมาไทยหลังอานวัยรุ่นที่ถูกพบในตลาดรังสิต ขี้เล่น ซื่อสัตย์ และเรียนรู้คำสั่งได้ไว",
    healthNote: "ฉีดวัคซีนพิษสุนัขบ้าแล้ว",
    isVaccinated: true, isSterilized: false, isUrgent: false,
    locationFound: "ตลาดรังสิต อำเภอธัญบุรี", province: "ปทุมธานี",
    status: "AVAILABLE", daysAgo: 25,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/74/Sunray_vom_Crown_Hill.jpeg/960px-Sunray_vom_Crown_Hill.jpeg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Sunray_vom_Crown_Hill_2.JPG/960px-Sunray_vom_Crown_Hill_2.JPG",
    ],
  },
  {
    key: "taengmo", name: "แตงโม", species: "DOG", breed: "ไทยพันทาง", gender: "FEMALE", ageMonths: 5,
    personality: ["ลูกหมา", "ขี้เล่น", "ชอบกัดรองเท้า"],
    description: "แตงโมเป็นลูกหมาที่ถูกพบที่ปั๊มน้ำมันถนนกาญจนาภิเษก ขี้เล่นมากและชอบกัดรองเท้า",
    healthNote: "ถ่ายพยาธิแล้ว ฉีดวัคซีนเข็มแรก",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "ปั๊มน้ำมันถนนกาญจนาภิเษก เขตบางแค", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 15,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6c/Puppy_in_Thailand.jpg/960px-Puppy_in_Thailand.jpg",
    ],
  },
  {
    key: "cocoa", name: "โกโก้", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 8,
    personality: ["ซน", "ชอบปีนป่าย"],
    description: "โกโก้เป็นแมวดำตาสีเหลือง ซนและชอบปีนป่ายที่สูง",
    healthNote: "ทำหมันแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยอุดมสุข 42 เขตบางนา", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 22,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/31/Black_Cat_in_Thailand_01.jpg/960px-Black_Cat_in_Thailand_01.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/69/Black_Cat_in_Thailand_02.jpg/960px-Black_Cat_in_Thailand_02.jpg",
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Black_Cat_in_Thailand_03.jpg/960px-Black_Cat_in_Thailand_03.jpg",
    ],
  },
  {
    key: "khaoniao", name: "ข้าวเหนียว", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 16,
    personality: ["ขี้เล่น", "ชอบกล่องกระดาษ"],
    description: "ข้าวเหนียวเป็นแมวขาวดำที่ชอบเล่นซ่อนหาและมุดกล่องกระดาษ",
    healthNote: "ทำหมันแล้ว",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ซอยสาทร 11 เขตสาทร", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 48,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/ff/Bangkok_kitty_-_2017-05-13_%28001%29.jpg/960px-Bangkok_kitty_-_2017-05-13_%28001%29.jpg",
    ],
  },
  {
    key: "khaitun", name: "ไข่ตุ๋น", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 18,
    personality: ["พลังเยอะ", "ชอบไล่จับเท้า"],
    description: "ไข่ตุ๋นเป็นแมวสามสีพลังเยอะจากตลาดบางกะปิ ชอบไล่จับเท้าคนเป็นที่สุด",
    healthNote: "ทำหมันแล้ว ฉีดวัคซีนครบ",
    isVaccinated: true, isSterilized: true, isUrgent: false,
    locationFound: "ตลาดบางกะปิ เขตบางกะปิ", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 10,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3a/Tortoiseshell_cats_in_Wat_Khung_Taphao_1.jpg/960px-Tortoiseshell_cats_in_Wat_Khung_Taphao_1.jpg",
    ],
  },
  {
    key: "itim", name: "ไอติม", species: "CAT", breed: "แมวไทยพันทาง", gender: "FEMALE", ageMonths: 5,
    personality: ["ขี้อ้อน", "ชอบให้เกาคาง"],
    description: "ไอติมเป็นลูกแมวขาวส้มที่ถูกพบในหอพักนักศึกษาย่านลาดกระบัง ขี้อ้อนและชอบให้เกาคาง",
    healthNote: "เคยติดหวัดแมว รักษาหายแล้ว ถ่ายพยาธิแล้ว",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "หอพักนักศึกษาย่านลาดกระบัง เขตลาดกระบัง", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 28,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Wat_Kungtapao_Local_Museum006.jpg/960px-Wat_Kungtapao_Local_Museum006.jpg",
    ],
  },
  {
    key: "bamee", name: "บะหมี่", species: "CAT", breed: "แมวไทยพันทาง", gender: "MALE", ageMonths: 6,
    personality: ["กล้าหาญ", "ไม่กลัวหมา"],
    description: "บะหมี่เป็นลูกแมวลายเสือส้มจากอู่ซ่อมรถ กล้าหาญจนไม่กลัวหมา",
    healthNote: "ถ่ายพยาธิแล้ว",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "อู่ซ่อมรถ ซอยประชาอุทิศ เขตทุ่งครุ", province: "กรุงเทพมหานคร",
    status: "AVAILABLE", daysAgo: 14,
    imageUrls: [
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/95/Ginger_kitten_with_an_orange_rubber_rugby.jpg/960px-Ginger_kitten_with_an_orange_rubber_rugby.jpg",
    ],
  },
  {
    key: "khaijiao", name: "ไข่เจียว", species: "OTHER", breed: "ไก่แจ้", gender: "FEMALE", ageMonths: 12,
    personality: ["เชื่อง", "ชอบคุ้ยดิน"],
    description: "ไข่เจียวเป็นไก่แจ้ที่เดินตามคนเหมือนลูกหมา ชอบคุ้ยดินหาอาหาร และยังออกไข่ได้",
    healthNote: "แข็งแรงดี ออกไข่ได้",
    isVaccinated: false, isSterilized: false, isUrgent: false,
    locationFound: "ชุมชนริมคลองบางกรวย อำเภอบางกรวย", province: "นนทบุรี",
    status: "AVAILABLE", daysAgo: 44,
    imageUrls: [
      "https://upload.wikimedia.org/wikipedia/commons/d/d4/Old_English_Bantam_hen_in_barnyard.jpg",
    ],
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
  { user: "user3@test.com", animal: "khanompang", housingType: "HOUSE", status: "APPROVED", daysAgo: 95,
    reason: "มีบ้านไม้สำหรับกระต่ายและพื้นที่หญ้าให้วิ่งเล่นในบ้าน" },
  { user: "user3@test.com", animal: "pudding", housingType: "HOUSE", status: "APPROVED", daysAgo: 128,
    reason: "อยากหาเพื่อนให้แมวที่บ้าน พุดดิ้งเข้ากับแมวได้ดีจึงเหมาะมาก" },
  { user: "user4@test.com", animal: "mali", housingType: "CONDO", status: "APPROVED", daysAgo: 120,
    reason: "เคยเลี้ยงแมววิเชียรมาศมาก่อน เข้าใจนิสัยช่างพูดของสายพันธุ์นี้" },
  { user: "user1@test.com", animal: "latte", housingType: "HOUSE", status: "APPROVED", daysAgo: 100,
    reason: "รับข้าวตังไปเลี้ยงแล้วประทับใจมาก อยากรับแมวอีกตัวมาอยู่ด้วยกัน" },
  { user: "user5@test.com", animal: "bualoi", housingType: "HOUSE", status: "APPROVED", daysAgo: 112,
    reason: "ที่บ้านมีหมาอีกตัวที่ชอบเล่นกับหมาตัวอื่น อยากหาเพื่อนให้" },
  // A rejected request on an adopted animal (someone else was approved)
  { user: "user4@test.com", animal: "khaotang", housingType: "CONDO", status: "REJECTED", daysAgo: 148,
    reason: "ชอบหมาพันธุ์ไทย อยากมีเพื่อนวิ่งออกกำลังกายตอนเช้า" },
  // Requests still waiting for the admin (their animals stay AVAILABLE)
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
  { user: "user1@test.com", animal: "lukkaew" },
  { user: "user1@test.com", animal: "nomsod" },
  { user: "user2@test.com", animal: "mochi" },
  { user: "user2@test.com", animal: "thongyip" },
  { user: "user2@test.com", animal: "tooptap" },
  { user: "user3@test.com", animal: "dang" },
  { user: "user3@test.com", animal: "lukkaew" },
  { user: "user3@test.com", animal: "mok" },
  { user: "user4@test.com", animal: "mok" },
  { user: "user4@test.com", animal: "nomsod" },
  { user: "user5@test.com", animal: "khaotang" },
  { user: "user5@test.com", animal: "lukkaew" },
  { user: "user1@test.com", animal: "chaokuay" },
  { user: "user2@test.com", animal: "puifai" },
  { user: "user3@test.com", animal: "tato" },
  { user: "user3@test.com", animal: "suea" },
  { user: "user4@test.com", animal: "mek" },
  { user: "user4@test.com", animal: "lucky" },
  { user: "user5@test.com", animal: "nongfah" },
  { user: "user5@test.com", animal: "thungthong" },
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

  { animal: "khanompang", author: "user3@test.com", images: 2, daysAgo: 80,
    caption: "ขนมปังมีบ้านไม้หลังใหม่ ชอบกระโดดดีใจตอนเย็น" },
  { animal: "khanompang", author: "user3@test.com", images: 1, daysAgo: 35,
    caption: "ขนมปังกินหญ้าทิโมธีเก่งมาก น้ำหนักกำลังดี" },

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

  { animal: "latte", author: "user1@test.com", images: 1, daysAgo: 85,
    caption: "ลาเต้เดินสำรวจบ้านทุกห้อง แล้วเลือกนอนบนเตียงเจ้าของ" },
  { animal: "latte", author: "user1@test.com", images: 2, daysAgo: 40,
    caption: "ลาเต้กับข้าวตังเริ่มเป็นเพื่อนกันแล้ว นอนข้างกันได้" },
  { animal: "latte", author: "admin@test.com", images: 1, daysAgo: 25,
    caption: "เรื่องราวของลาเต้และข้าวตังคือสิ่งที่เราอยากเห็นที่สุด ขอบคุณครับ" },

  { animal: "bualoi", author: "admin@test.com", images: 2, daysAgo: 99,
    caption: "บัวลอยออกเดินทางไปบ้านใหม่แล้ว มีพี่หมาอีกตัวรอเล่นด้วย" },
  { animal: "bualoi", author: "user5@test.com", images: 4, daysAgo: 75,
    caption: "บัวลอยกับพี่โบ้เล่นกันทั้งวัน นอนกอดกันตอนกลางคืน" },
  { animal: "bualoi", author: "user5@test.com", images: 3, daysAgo: 15,
    caption: "พาไปเที่ยวทะเลครั้งแรก วิ่งไล่คลื่นสนุกมาก" },
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
