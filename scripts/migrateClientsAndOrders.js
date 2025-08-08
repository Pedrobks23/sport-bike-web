// Migra clientes e ordens para usar clienteId, statusKey e datas normalizadas
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

const normalizePhone = (p = '') => String(p).replace(/\D/g, '');

async function migrateClients() {
  const snap = await db.collection('clientes').get();
  let count = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const patch = {};
    if (d.telefone && !d.telefoneNormalizado) {
      patch.telefoneNormalizado = normalizePhone(d.telefone);
    }
    if (!d.createdAt) patch.createdAt = Timestamp.now();
    patch.updatedAt = Timestamp.now();
    if (Object.keys(patch).length) {
      await docSnap.ref.update(patch);
      count++;
    }
  }
  console.log(`Clientes atualizados: ${count}`);
}

async function migrateOrders() {
  const snap = await db.collection('ordens').get();
  let migrated = 0;
  for (const docSnap of snap.docs) {
    const d = docSnap.data();
    const patch = {};
    const statusKey = String(d.status || '').toLowerCase().trim();
    if (d.statusKey !== statusKey) patch.statusKey = statusKey;

    if (!d.clienteId) {
      const phone = normalizePhone(d.cliente?.telefone || '');
      let clienteId = null;
      if (phone) {
        const cSnap = await db
          .collection('clientes')
          .where('telefoneNormalizado', '==', phone)
          .limit(1)
          .get();
        if (!cSnap.empty) clienteId = cSnap.docs[0].id;
      }
      if (!clienteId) {
        const newClient = await db.collection('clientes').add({
          nome: d.cliente?.nome || 'Cliente (migrado)',
          telefone: d.cliente?.telefone || '',
          telefoneNormalizado: phone,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
        clienteId = newClient.id;
      }
      patch.clienteId = clienteId;
    }

    const concl = d.dataConclusao;
    const atu = d.dataAtualizacao;
    const cri = d.dataCriacao;
    if (statusKey === 'pronto' || statusKey === 'entregue') {
      const finalTs = concl || atu || cri || Timestamp.now();
      if (!concl) patch.dataConclusao = finalTs;
      if (!d.dataIndex) patch.dataIndex = finalTs;
    } else if (!d.dataIndex) {
      patch.dataIndex = atu || cri || Timestamp.now();
    }

    if (Object.keys(patch).length) {
      await docSnap.ref.update(patch);
      migrated++;
    }
  }
  console.log(`Ordens atualizadas: ${migrated}`);
}

await migrateClients();
await migrateOrders();
console.log('Migração concluída.');
