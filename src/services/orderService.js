// src/services/orderService.js
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const getOrders = async () => {
  try {
    const ordersRef = collection(db, 'ordens');
    const q = query(ordersRef, orderBy('dataCriacao', 'desc'));
    const snapshot = await getDocs(q);
    
    const orders = {
      pending: [],
      inProgress: [],
      done: []
    };

    snapshot.forEach((doc) => {
      const order = { id: doc.id, ...doc.data() };
      switch(order.status) {
        case 'Pendente':
          orders.pending.push(order);
          break;
        case 'Em Andamento':
          orders.inProgress.push(order);
          break;
        case 'Pronto':
          orders.done.push(order);
          break;
      }
    });

    return orders;
  } catch (error) {
    console.error('Erro ao buscar ordens:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await updateDoc(orderRef, { 
      status: newStatus,
      dataAtualizacao: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const addServiceToBike = async (orderId, bikeIndex, newService) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Ordem não encontrada');

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }
    
    bikes[bikeIndex].services[newService.nome] = newService.quantidade;
    
    // Atualiza o valor total
    order.valorTotal = (order.valorTotal || 0) + (newService.valor * newService.quantidade);

    await updateDoc(orderRef, { 
      bicicletas: bikes,
      valorTotal: order.valorTotal,
      dataAtualizacao: new Date()
    });
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    throw error;
  }
};

export const updateOrderService = async (orderId, bikeIndex, serviceName, updatedService) => {
  try {
    const orderRef = doc(db, "ordens", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    // Verifica se a bicicleta existe
    if (!bikes[bikeIndex]) {
      throw new Error("Bicicleta não encontrada");
    }

    // Garante que o objeto services existe
    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }

    // Atualiza o serviço
    bikes[bikeIndex].services[updatedService.nome] = updatedService.quantidade;

    // Recalcula o valor total
    let valorTotal = 0;
    bikes.forEach(bike => {
      Object.entries(bike.services || {}).forEach(([nome, quantidade]) => {
        valorTotal += quantidade * (updatedService.valor || 70); // valor padrão 70 se não especificado
      });
    });

    // Atualiza a ordem com os serviços atualizados
    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal,
      dataAtualizacao: new Date()
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    throw error;
  }
};

// Adicionar essas funções ao arquivo orderService.js
export const removeOrderPart = async (orderId, bikeIndex, partIndex) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Ordem não encontrada');

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    // Remove a peça específica e recalcula o valor total
    const pecaRemovida = bikes[bikeIndex].pecas[partIndex];
    const novoTotal = order.valorTotal - parseFloat(pecaRemovida.valor);
    
    // Remove a peça do array
    bikes[bikeIndex].pecas = bikes[bikeIndex].pecas.filter((_, idx) => idx !== partIndex);

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao remover peça:', error);
    throw error;
  }
};

export const updateOrderPart = async (orderId, bikeIndex, partIndex, updatedPart) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Ordem não encontrada');

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    // Calcula a diferença de valor
    const pecaAntiga = bikes[bikeIndex].pecas[partIndex];
    const diferencaValor = parseFloat(updatedPart.valor) - parseFloat(pecaAntiga.valor);
    
    // Atualiza a peça
    bikes[bikeIndex].pecas[partIndex] = updatedPart;
    
    // Atualiza o valor total da ordem
    const novoTotal = order.valorTotal + diferencaValor;

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar peça:', error);
    throw error;
  }
};

// Adicione no arquivo orderService.js
export const removeOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await deleteDoc(orderRef);
    // Também remova documentos relacionados se necessário
    
    return true;
  } catch (error) {
    console.error('Erro ao remover ordem:', error);
    throw error;
  }
};

export const removeOrderService = async (orderId, bikeIndex, serviceName) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Ordem não encontrada');

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    const services = { ...bikes[bikeIndex].services };
    const quantidade = parseInt(services[serviceName] || 0);
    const valorServico = parseFloat(order.valorServicos?.[serviceName] || 70); // valor padrão 70 se não encontrar
    delete services[serviceName];
    
    bikes[bikeIndex].services = services;

    // Atualiza o valor total com tratamento para NaN
    const valorAtual = parseFloat(order.valorTotal || 0);
    const valorRemovido = quantidade * valorServico;
    const novoTotal = Math.max(0, valorAtual - valorRemovido); // Garante que não fique negativo

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    throw error;
  }
};

export const addPartToBike = async (orderId, bikeIndex, newPart) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) throw new Error('Ordem não encontrada');

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex].pecas) {
      bikes[bikeIndex].pecas = [];
    }
    
    bikes[bikeIndex].pecas.push(newPart);
    order.valorTotal = (order.valorTotal || 0) + newPart.valor;

    await updateDoc(orderRef, { 
      bicicletas: bikes,
      valorTotal: order.valorTotal,
      dataAtualizacao: new Date()
    });
  } catch (error) {
    console.error('Erro ao adicionar peça:', error);
    throw error;
  }
};

export const addObservation = async (orderId, observation) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await updateDoc(orderRef, { 
      observacoes: observation,
      dataAtualizacao: new Date()
    });
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    throw error;
  }
};