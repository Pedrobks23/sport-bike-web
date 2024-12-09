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
        // Se não for fornecido um valor, retorna array vazio
        return [];
      }

      // Remove caracteres especiais do telefone
      const telefoneNumerico = valor.replace(/\D/g, '');
      console.log('Buscando pelo telefone:', telefoneNumerico);
      
      // Filtra por telefone
      q = query(
        osRef,
        where('cliente.telefone', '==', telefoneNumerico)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Ordena e limita a 3 para consulta normal
      ordens.sort((a, b) => b.dataCriacao - a.dataCriacao);

      return ordens.slice(0, 3);

    } else if (tipo === 'historico') {
      // Para histórico, o valor (telefone) precisa ser passado explicitamente
      if (!valor) {
        // Se não tiver telefone, retorna vazio
        return [];
      }

      const telefoneNumerico = valor.replace(/\D/g, '');
      q = query(
        osRef,
        where('cliente.telefone', '==', telefoneNumerico)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((doc) => {
        ordens.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Se não houver ordens encontradas, retorna array vazio
      if (ordens.length === 0) {
        return [];
      }

      // Ordena as ordens
      ordens.sort((a, b) => b.dataCriacao - a.dataCriacao);
      return ordens;

    } else {
      // Busca por código da OS caso 'tipo' não seja telefone nem histórico
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
    // Em caso de erro, retorna array vazio para não exibir nada
    return [];
  }
};

export { db };