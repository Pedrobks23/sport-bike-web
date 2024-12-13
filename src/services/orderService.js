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

export const addServiceToBike = async (orderId, bikeIndex, service) => {
  try {
    console.log('Adicionando serviço:', { orderId, bikeIndex, service }); // Debug
    
    const orderRef = doc(db, "ordens", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }
    
    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }
    
    // Adiciona o serviço
    bikes[bikeIndex].services[service.nome] = parseInt(service.quantidade);
    
    // Calcula o total para cada bicicleta
    bikes.forEach((bike, index) => {
      let bikeTotal = 0;
      if (bike.services) {
        Object.entries(bike.services).forEach(([nome, quantidade]) => {
          const servicoValor = order.valorServicos?.[nome];
          if (servicoValor) {
            const valorCalculado = quantidade * servicoValor;
            console.log(`Bike ${index} - Serviço ${nome}: ${quantidade} x ${servicoValor} = ${valorCalculado}`); // Debug
            bikeTotal += valorCalculado;
          }
        });
      }
      bike.total = bikeTotal;
      console.log(`Total da bike ${index}:`, bikeTotal); // Debug
    });
    
    // Calcula o valor total da ordem
    const valorTotal = bikes.reduce((total, bike) => total + (bike.total || 0), 0);
    console.log('Valor total calculado:', valorTotal); // Debug
    
    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: valorTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar serviço:", error);
    throw error;
  }
};

export const updateOrderService = async (orderId, bikeIndex, serviceName, updatedService) => {
  try {
    if (typeof bikeIndex !== 'number' || bikeIndex < 0) {
      throw new Error(`Índice da bicicleta inválido: ${bikeIndex}`);
    }

    const orderRef = doc(db, "ordens", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }

    const orderData = orderDoc.data();
    if (!orderData.bicicletas || !orderData.bicicletas[bikeIndex]) {
      throw new Error(`Bicicleta não encontrada no índice ${bikeIndex}`);
    }

    const bikes = JSON.parse(JSON.stringify(orderData.bicicletas));

    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }

    // Remove serviço antigo se o nome mudou
    if (serviceName !== updatedService.nome) {
      delete bikes[bikeIndex].services[serviceName];
    }

    // Atualiza o serviço com a nova quantidade
    bikes[bikeIndex].services[updatedService.nome] = parseInt(updatedService.quantidade);

    // Atualiza o total da bicicleta
    bikes[bikeIndex].total = parseFloat(updatedService.valor) * parseInt(updatedService.quantidade);

    // Calcula novo valor total da ordem
    const novoValorTotal = bikes.reduce((total, bike) => total + (bike.total || 0), 0);

    // Atualiza o documento
    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoValorTotal,
      dataAtualizacao: serverTimestamp()
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