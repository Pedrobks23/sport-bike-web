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
      // Mapeia os status do banco para as chaves do estado
      const statusMap = {
        'Pendente': 'pending',
        'Em Andamento': 'inProgress',
        'Pronto': 'done'
      };
      
      const stateKey = statusMap[order.status] || 'pending';
      orders[stateKey].push(order);
    });

    return orders;
  } catch (error) {
    console.error('Erro ao buscar ordens:', error);
    throw error;
  }
};

export const getOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordem não encontrada');
    }
    
    return { id: orderDoc.id, ...orderDoc.data() };
  } catch (error) {
    console.error('Erro ao buscar ordem:', error);
    throw error;
  }
};

export const updateOrderPart = async (orderId, bikeIndex, partIndex, updatedPart) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordem não encontrada');
    }

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex]) {
      throw new Error('Bicicleta não encontrada');
    }

    if (!bikes[bikeIndex].pecas) {
      bikes[bikeIndex].pecas = [];
    }

    // Calcula a diferença de valor
    const pecaAntiga = bikes[bikeIndex].pecas[partIndex];
    const diferencaValor = parseFloat(updatedPart.valor) - parseFloat(pecaAntiga.valor);
    
    // Atualiza a peça
    bikes[bikeIndex].pecas[partIndex] = {
      ...updatedPart,
      valor: parseFloat(updatedPart.valor)
    };
    
    // Atualiza o valor total da ordem
    const novoTotal = parseFloat(order.valorTotal || 0) + diferencaValor;

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar peça:', error);
    throw error;
  }
};

// Adicione esta função ao orderService.js junto com as outras funções

export const getServices = async () => {
  try {
    const servicosRef = collection(db, 'servicos');
    const snapshot = await getDocs(servicosRef);
    
    const servicesData = {};
    snapshot.forEach((doc) => {
      // Assumindo que cada documento tem 'nome' e 'valor'
      const data = doc.data();
      servicesData[doc.id] = parseFloat(data.valor);
    });
    
    return servicesData;
  } catch (error) {
    console.error('Erro ao buscar tabela de serviços:', error);
    throw error;
  }
};

export const updateOrderService = async (orderId, bikeIndex, oldServiceName, updatedService) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordem não encontrada');
    }

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    const bike = bikes[bikeIndex];

    // Remove serviço antigo
    if (bike.services[oldServiceName]) {
      delete bike.services[oldServiceName];
      if (bike.serviceValues) {
        delete bike.serviceValues[oldServiceName];
      }
    }

    // Adiciona serviço atualizado
    bike.services = bike.services || {};
    bike.serviceValues = bike.serviceValues || {};

    bike.services[updatedService.nome] = updatedService.quantidade;
    bike.serviceValues[updatedService.nome] = {
      valor: parseFloat(updatedService.valor),
      valorFinal: parseFloat(updatedService.valor)
    };

    // Atualiza os dados da ordem
    await updateDoc(orderRef, {
      bicicletas: bikes,
      dataAtualizacao: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    throw error;
  }
};

export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await updateDoc(orderRef, { 
      status: newStatus,
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
};

export const removeOrder = async (orderId) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await deleteDoc(orderRef);
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

    // Salva o valor do serviço antes de removê-lo
    const quantidade = parseInt(bikes[bikeIndex].services[serviceName] || 0);
    const valorServico = order.valorServicos?.[serviceName] || 70; // Valor padrão se não encontrado
    const valorTotal = quantidade * valorServico;

    // Remove o serviço
    delete bikes[bikeIndex].services[serviceName];

    // Recalcula o total da bike
    let bikeTotal = 0;
    Object.entries(bikes[bikeIndex].services || {}).forEach(([nome, qtd]) => {
      const servicoValor = order.valorServicos?.[nome] || 70;
      bikeTotal += qtd * servicoValor;
    });

    // Adiciona valores das peças
    if (bikes[bikeIndex].pecas) {
      bikes[bikeIndex].pecas.forEach(peca => {
        bikeTotal += parseFloat(peca.valor || 0);
      });
    }

    bikes[bikeIndex].total = bikeTotal;

    // Recalcula o valor total da ordem
    const novoTotal = bikes.reduce((total, bike) => total + (bike.total || 0), 0);

    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Erro ao remover serviço:', error);
    throw error;
  }
};

export const addServiceToBike = async (orderId, bikeIndex, newService) => {
  try {
    const orderRef = doc(db, "ordens", orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }
    
    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex]) {
      throw new Error("Bicicleta não encontrada");
    }
    
    if (!bikes[bikeIndex].services) {
      bikes[bikeIndex].services = {};
    }

    if (!bikes[bikeIndex].serviceValues) {
      bikes[bikeIndex].serviceValues = {};
    }
    
    // Adiciona o novo serviço
    bikes[bikeIndex].services[newService.nome] = parseInt(newService.quantidade);
    
    // Adiciona os valores do serviço
    bikes[bikeIndex].serviceValues[newService.nome] = {
      valor: parseFloat(newService.valor || 0),
      valorFinal: parseFloat(newService.valor || 0)
    };
    
    // Calcula o total para a bicicleta
    let bikeTotal = 0;
    Object.entries(bikes[bikeIndex].services).forEach(([nome, quantidade]) => {
      const serviceValue = bikes[bikeIndex].serviceValues[nome];
      const valorServico = serviceValue ? parseFloat(serviceValue.valorFinal || serviceValue.valor || 0) : 0;
      bikeTotal += quantidade * valorServico;
    });

    // Adiciona valores das peças existentes
    if (bikes[bikeIndex].pecas) {
      bikes[bikeIndex].pecas.forEach(peca => {
        bikeTotal += parseFloat(peca.valor || 0);
      });
    }

    bikes[bikeIndex].total = bikeTotal;
    
    // Calcula o novo valor total da ordem
    const novoTotal = bikes.reduce((total, bike) => total + (bike.total || 0), 0);
    
    await updateDoc(orderRef, {
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error("Erro ao adicionar serviço:", error);
    throw error;
  }
};

export const addPartToBike = async (orderId, bikeIndex, newPart) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordem não encontrada');
    }

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex]) {
      throw new Error('Bicicleta não encontrada');
    }
    
    if (!bikes[bikeIndex].pecas) {
      bikes[bikeIndex].pecas = [];
    }
    
    // Adiciona a nova peça
    bikes[bikeIndex].pecas.push({
      ...newPart,
      valor: parseFloat(newPart.valor)
    });
    
    // Recalcula o total da ordem
    const novoTotal = parseFloat(order.valorTotal || 0) + parseFloat(newPart.valor);

    await updateDoc(orderRef, { 
      bicicletas: bikes,
      valorTotal: novoTotal,
      dataAtualizacao: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Erro ao adicionar peça:', error);
    throw error;
  }
};

export const removeOrderPart = async (orderId, bikeIndex, partIndex) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    const orderDoc = await getDoc(orderRef);
    
    if (!orderDoc.exists()) {
      throw new Error('Ordem não encontrada');
    }

    const order = orderDoc.data();
    const bikes = [...order.bicicletas];
    
    if (!bikes[bikeIndex]) {
      throw new Error('Bicicleta não encontrada');
    }
    
    if (!bikes[bikeIndex].pecas) {
      throw new Error('Nenhuma peça encontrada para esta bicicleta');
    }

    // Remove a peça e calcula o novo total
    const pecaRemovida = bikes[bikeIndex].pecas[partIndex];
    const novoTotal = parseFloat(order.valorTotal || 0) - parseFloat(pecaRemovida.valor || 0);
    
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

export const getLatestCompletedOrderByPhone = async (phone) => {
  try {
    const ordersRef = collection(db, 'ordens');
    const q = query(ordersRef, where('cliente.telefone', '==', phone));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    let latest = null;
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === 'Pronto') {
        if (!latest ||
            (data.dataAtualizacao?.toMillis() || 0) >
              (latest.dataAtualizacao?.toMillis() || 0)) {
          latest = { id: docSnap.id, ...data };
        }
      }
    });
    return latest;
  } catch (error) {
    console.error('Erro ao buscar ordem pronta:', error);
    throw error;
  }
};

export const addObservation = async (orderId, observation) => {
  try {
    const orderRef = doc(db, 'ordens', orderId);
    await updateDoc(orderRef, { 
      observacoes: observation,
      dataAtualizacao: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Erro ao adicionar observação:', error);
    throw error;
  }
};

export { db };