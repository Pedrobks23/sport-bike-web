import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../config/firebase";

export function listenMecanicos(cb, onError) {
  try {
    const q = query(collection(db, "mecanicos"), orderBy("nome", "asc"));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      onError
    );
  } catch (e) {
    onError?.(e);
    return () => {};
  }
}
