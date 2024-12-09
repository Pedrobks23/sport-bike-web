import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, 
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
 storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
 messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
 appId: import.meta.env.VITE_FIREBASE_APP_ID,
 measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const consultarOS = async (tipo, valor) => {
  try {
    const osRef = collection(db, 'ordens');
    let q;
    const ordens = [];
 
    if (tipo === 'telefone') {
      if (!valor) {
        return [];
      }
 
      const telefoneNumerico = valor.replace(/\D/g, '');
console.log('Buscando pelo telefone:', telefoneNumerico);

// Filtra por telefone
q = query(
 osRef,
 where('cliente.telefone', '==', telefoneNumerico),
 orderBy('dataCriacao', 'desc')
);

const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
 ordens.push({
   id: doc.id,
   ...doc.data()
 });
});

// Limita a 3 para consulta normal 
return ordens.slice(0, 3);

} else if (tipo === 'historico') {
 if (!valor) {
   return [];
 }

 const telefoneNumerico = valor.replace(/\D/g, '');
 q = query(
   osRef,
   where('cliente.telefone', '==', telefoneNumerico), 
   orderBy('dataCriacao', 'desc')
 );
 
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data()
        });
      });
 
      if (ordens.length === 0) {
        return [];
      }
 
      return ordens;
 
    } else {
      if (!valor) {
        return [];
      }
 
      q = query(osRef, where('codigo', '==', valor));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data()
        });
      });
 
      return ordens;
    }
 
  } catch (error) {
    console.error('Erro ao consultar OS:', error);
    return [];
  }
 };
 
 export { db };