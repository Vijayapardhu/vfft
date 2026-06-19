export interface WeaponDef {
  id: string;
  name: string;
  category: string;
}

export const FF_WEAPON_CATEGORIES = [
  "Assault Rifles",
  "Marksman Rifles",
  "Submachine Guns",
  "Shotguns",
  "Sniper Rifles",
  "Machine Guns",
  "Pistols",
  "Launchers & Bows",
  "Melee",
  "Projectiles",
] as const;

export const FF_WEAPONS: WeaponDef[] = [
  // Assault Rifles
  { id: "AK", name: "AK", category: "Assault Rifles" },
  { id: "AN94", name: "AN94", category: "Assault Rifles" },
  { id: "AUG", name: "AUG", category: "Assault Rifles" },
  { id: "FAMAS", name: "FAMAS", category: "Assault Rifles" },
  { id: "G36", name: "G36", category: "Assault Rifles" },
  { id: "Groza", name: "Groza", category: "Assault Rifles" },
  { id: "Heatgun", name: "Heatgun", category: "Assault Rifles" },
  { id: "Kingfisher", name: "Kingfisher", category: "Assault Rifles" },
  { id: "M4A1", name: "M4A1", category: "Assault Rifles" },
  { id: "ParaFAL", name: "ParaFAL", category: "Assault Rifles" },
  { id: "SCAR", name: "SCAR", category: "Assault Rifles" },
  { id: "ShieldGun", name: "Shield Gun", category: "Assault Rifles" },
  { id: "TreatmentLaserGun", name: "Treatment Laser Gun", category: "Assault Rifles" },
  { id: "XM8", name: "XM8", category: "Assault Rifles" },
  // Marksman Rifles
  { id: "AC80", name: "AC80", category: "Marksman Rifles" },
  { id: "M14", name: "M14", category: "Marksman Rifles" },
  { id: "SKS", name: "SKS", category: "Marksman Rifles" },
  { id: "SVD", name: "SVD", category: "Marksman Rifles" },
  { id: "Winchester", name: "Winchester", category: "Marksman Rifles" },
  { id: "Woodpecker", name: "Woodpecker", category: "Marksman Rifles" },
  // Submachine Guns
  { id: "BIZON", name: "BIZON", category: "Submachine Guns" },
  { id: "CG15", name: "CG15", category: "Submachine Guns" },
  { id: "MAC10", name: "MAC10", category: "Submachine Guns" },
  { id: "MP40", name: "MP40", category: "Submachine Guns" },
  { id: "MP5", name: "MP5", category: "Submachine Guns" },
  { id: "P90", name: "P90", category: "Submachine Guns" },
  { id: "Thompson", name: "Thompson", category: "Submachine Guns" },
  { id: "UMP", name: "UMP", category: "Submachine Guns" },
  { id: "Vector", name: "Vector", category: "Submachine Guns" },
  { id: "VSS", name: "VSS", category: "Submachine Guns" },
  // Shotguns
  { id: "ChargeBuster", name: "Charge Buster", category: "Shotguns" },
  { id: "M1014", name: "M1014", category: "Shotguns" },
  { id: "M1887", name: "M1887", category: "Shotguns" },
  { id: "M590", name: "M590", category: "Shotguns" },
  { id: "MAG7", name: "MAG-7", category: "Shotguns" },
  { id: "SPAS12", name: "SPAS12", category: "Shotguns" },
  { id: "TROGON", name: "TROGON", category: "Shotguns" },
  // Sniper Rifles
  { id: "AWM", name: "AWM", category: "Sniper Rifles" },
  { id: "Kar98K", name: "Kar98K", category: "Sniper Rifles" },
  { id: "M24", name: "M24", category: "Sniper Rifles" },
  { id: "M82B", name: "M82B", category: "Sniper Rifles" },
  { id: "TreatmentSniper", name: "Treatment Sniper", category: "Sniper Rifles" },
  { id: "VSK94", name: "VSK94", category: "Sniper Rifles" },
  // Machine Guns
  { id: "Gatling", name: "Gatling", category: "Machine Guns" },
  { id: "KORD", name: "KORD", category: "Machine Guns" },
  { id: "M60", name: "M60", category: "Machine Guns" },
  { id: "M249", name: "M249", category: "Machine Guns" },
  // Pistols
  { id: "MiniUzi", name: "Mini Uzi", category: "Pistols" },
  { id: "Flamethrower", name: "Flamethrower", category: "Pistols" },
  { id: "Knife", name: "Knife", category: "Pistols" },
  { id: "DesertEagle", name: "Desert Eagle", category: "Pistols" },
  { id: "G18", name: "G18", category: "Pistols" },
  { id: "M1873", name: "M1873", category: "Pistols" },
  { id: "M500", name: "M500", category: "Pistols" },
  { id: "TreatmentGun", name: "Treatment Gun", category: "Pistols" },
  { id: "USP", name: "USP", category: "Pistols" },
  { id: "USP2", name: "USP-2", category: "Pistols" },
  { id: "M1917", name: "M1917", category: "Pistols" },
  // Launchers & Bows
  { id: "Crossbow", name: "Crossbow", category: "Launchers & Bows" },
  { id: "FGL24", name: "FGL-24", category: "Launchers & Bows" },
  { id: "HandCannon", name: "Hand-Cannon", category: "Launchers & Bows" },
  { id: "M79", name: "M79", category: "Launchers & Bows" },
  { id: "MGL140", name: "MGL140", category: "Launchers & Bows" },
  { id: "RGS50", name: "RGS50", category: "Launchers & Bows" },
  // Melee
  { id: "Bat", name: "Bat", category: "Melee" },
  { id: "Katana", name: "Katana", category: "Melee" },
  { id: "Machete", name: "Machete", category: "Melee" },
  { id: "Pan", name: "Pan", category: "Melee" },
  { id: "Scythe", name: "Scythe", category: "Melee" },
  // Projectiles
  { id: "FlashFreeze", name: "Flash Freeze", category: "Projectiles" },
  { id: "GlooMelter", name: "Gloo Melter", category: "Projectiles" },
  { id: "GlooWall", name: "Gloo Wall", category: "Projectiles" },
  { id: "Grenade", name: "Grenade", category: "Projectiles" },
  { id: "SmokeGrenade", name: "Smoke Grenade", category: "Projectiles" },
];

export const MAX_GUN_LEVEL = 12;
