/** A weapon definition document in the `weapons` Firestore collection. */
export interface Weapon {
  id: string;
  name: string;
  category: string;
  imageURL?: string;
}
