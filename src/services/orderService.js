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
    
    bikes[bikeIndex].services[newService.nome] = parseInt(newService.quantidade);
    
    // Recalcula o valor total
    let valorTotal = 0;
    bikes.forEach(bike => {
      // Soma valores dos serviços
      if (bike.services) {
        Object.entries(bike.services).forEach(([nome, quantidade]) => {
          valorTotal += quantidade * (newService.valor || 70);
        });
      }
      
      // Soma valores das peças
      if (bike.pecas) {
        bike.pecas.forEach(peca => {
          valorTotal += parseFloat(peca.valor) || 0;
        });
      }
    });

    await updateDoc(orderRef, { 
      bicicletas: bikes,
      valorTotal: parseFloat(valorTotal.toFixed(2)),
      dataAtualizacao: serverTimestamp()
    });
  } catch (error) {
    console.error('Erro ao adicionar serviço:', error);
    throw error;
  }
};

export const updateOrderService = async (orderId, bikeIndex, serviceName, updatedService) => {
  try {
    console.log('Iniciando updateOrderService com:', {
      orderId,
      bikeIndex,
      serviceName,
      updatedService
    });

    // 1. Busca a ordem
    const orderRef = doc(db, "ordens", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }

    // 2. Pega os dados da ordem e loga
    const orderData = orderDoc.data();
    console.log('Dados da ordem:', orderData);

    // 3. Verifica se bicicletas existe
    if (!orderData.bicicletas) {
      console.log('Array de bicicletas não existe, criando...');
      orderData.bicicletas = [];
    }

    // 4. Loga o array de bicicletas
    console.log('Array de bicicletas:', orderData.bicicletas);
    console.log('Tentando acessar bicicleta no índice:', bikeIndex);

    // 5. Verifica se a bicicleta existe no índice especificado
    if (!orderData.bicicletas[bikeIndex]) {
      console.log('Bicicleta não encontrada no índice:', bikeIndex);
      console.log('Total de bicicletas:', orderData.bicicletas.length);
      throw new Error(`Bicicleta não encontrada no índice ${bikeIndex}`);
    }

    // 6. Cria uma cópia do array de bicicletas
    const bikes = [...orderData.bicicletas];

    // 7. Inicializa ou atualiza os serviços
    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }

    // 8. Atualiza o serviço
    if (serviceName !== updatedService.nome) {
      delete bikes[bikeIndex].services[serviceName];
    }
    bikes[bikeIndex].services[updatedService.nome] = parseInt(updatedService.quantidade);

    console.log('Bicicletas após atualização:', bikes);

    // 9. Atualiza o documento
    await updateDoc(orderRef, {
      bicicletas: bikes,
      dataAtualizacao: serverTimestamp()
    });

    console.log('Documento atualizado com sucesso');
    return { success: true };

  } catch (error) {
    console.error('Erro detalhado:', {
      message: error.message,
      orderId,
      bikeIndex,
      serviceName,
      stack: error.stack
    });
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
    
    if (!bikes[bikeIndex].services) {
      throw new Error('Nenhum serviço encontrado para esta bicicleta');
    }

    const quantidade = parseInt(bikes[bikeIndex].services[serviceName] || 0);
    const valorServico = 70; // Valor padrão fixo
    delete bikes[bikeIndex].services[serviceName];

    // Recalcula valor total
    let valorTotal = 0;
    bikes.forEach(bike => {
      // Soma valores dos serviços
      if (bike.services) {
        Object.entries(bike.services).forEach(([nome, qtd]) => {
          valorTotal += qtd * valorServico;
        });
      }
      
      // Soma valores das peças
      if (bike.pecas) {
        bike.pecas.forEach(peca => {
          valorTotal += parseFloat(peca.valor) || 0;
        });
      }
    });

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: parseFloat(valorTotal.toFixed(2)),
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