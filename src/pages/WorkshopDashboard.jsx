import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { 
  getOrders, 
  updateOrderStatus,
  addServiceToBike,
  addPartToBike, 
  addObservation,
  removeOrder,
  updateOrderService,
  removeOrderService,
  removeOrderPart,
  updateOrderPart
} from '../services/orderService';

const WorkshopDashboard = () => {
  const navigate = useNavigate();
  
  const [orders, setOrders] = useState({
    pending: [],
    inProgress: [],
    done: []
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [showEditPartModal, setShowEditPartModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedPeca, setSelectedPeca] = useState(null);

  // Componente para o card de OS
  const OrderCard = ({ order }) => {
    const [showStatusMenu, setShowStatusMenu] = useState(false);
  
    const handleStatusChange = async (newStatus) => {
      try {
        await updateOrderStatus(order.id, newStatus);
        await loadOrders();
        setShowStatusMenu(false);
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    };
  
    const handleRemove = async () => {
      const isConfirmed = window.confirm(
        `Tem certeza que deseja remover a OS ${order.codigo}?\nEsta ação não pode ser desfeita.`
      );
  
      if (isConfirmed) {
        try {
          await removeOrder(order.id);
          await loadOrders();
        } catch (error) {
          console.error('Erro ao remover ordem:', error);
          alert('Erro ao remover a ordem de serviço. Tente novamente.');
        }
      }
    };
  
    return (
      <div 
        className="bg-white p-4 rounded-lg shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow relative"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{order.codigo}</span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowStatusMenu(!showStatusMenu);
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              •••
            </button>
            {showStatusMenu && (
              <div 
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="py-1" role="menu">
                  <button
                    onClick={() => handleStatusChange('Pendente')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Pendente
                  </button>
                  <button
                    onClick={() => handleStatusChange('Em Andamento')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Em Andamento
                  </button>
                  <button
                    onClick={() => handleStatusChange('Pronto')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Pronto
                  </button>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleRemove}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remover OS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div 
          onClick={() => {
            setSelectedOrder(order);
            setShowModal(true);
          }}
        >
          <div className="flex flex-col gap-1">
            <p className="text-gray-700 text-sm">
              <strong>Data:</strong> {new Date(order.dataCriacao).toLocaleDateString()}
            </p>
            {order.dataAgendamento && (
              <p className="text-gray-600 text-sm">
                <strong>Agendamento:</strong> {new Date(order.dataAgendamento).toLocaleDateString()}
              </p>
            )}
            <p className="text-gray-600 text-sm">
              <strong>Total:</strong> R$ {order.valorTotal}
            </p>
          </div>
  
          <div className="mt-2">
            {order.bicicletas?.map((bike, index) => (
              <div key={index} className="text-xs text-gray-500">
                {bike.marca} {bike.modelo} ({bike.cor})
              </div>
            ))}
          </div>
  
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className={`px-2 py-1 rounded-full text-xs ${
              order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
              order.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {order.status}
            </span>
            <span>{order.cliente?.telefone}</span>
          </div>
        </div>
      </div>
    );
  };

const OrderDetails = ({ order }) => {
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showObsModal, setShowObsModal] = useState(false);
  const [selectedBikeIndex, setSelectedBikeIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddService = async (bikeIndex, serviceData) => {
    try {
      setLoading(true);
      await addServiceToBike(order.id, bikeIndex, serviceData);
      await loadOrders(); // Recarrega todas as ordens
      setShowServiceModal(false);
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async (bikeIndex, partData) => {
    try {
      setLoading(true);
      await addPartToBike(order.id, bikeIndex, partData);
      await loadOrders();
      setShowPartModal(false);
    } catch (error) {
      console.error('Erro ao adicionar peça:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddObservation = async (observation) => {
    try {
      setLoading(true);
      await addObservation(order.id, observation);
      await loadOrders();
      setShowObsModal(false);
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold">{order.codigo}</h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
   
          <div className="mb-6">
            <h3 className="font-bold mb-2">Cliente</h3>
            <p><strong>Nome:</strong> {order.cliente?.nome}</p>
            <p><strong>Telefone:</strong> {order.cliente?.telefone}</p>
            <p><strong>Data de Criação:</strong> {new Date(order.dataCriacao).toLocaleString()}</p>
            {order.dataAgendamento && (
              <p><strong>Agendamento:</strong> {new Date(order.dataAgendamento).toLocaleString()}</p>
            )}
          </div>
   
          <div className="mb-6">
            <h3 className="font-bold mb-4">Bicicletas</h3>
            {order.bicicletas?.map((bike, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-bold mb-2">Bike {index + 1}</h4>
                <p><strong>Marca:</strong> {bike.marca}</p>
                <p><strong>Modelo:</strong> {bike.modelo}</p>
                <p><strong>Cor:</strong> {bike.cor}</p>
   
                <div className="mt-3">
                  <p className="font-bold mb-1">Serviços:</p>
                  <ul className="list-disc list-inside">
                    {bike.services && Object.entries(bike.services).map(([service, quantity]) => (
                      <li key={service} className="flex items-center justify-between">
                        <span>{service} - {quantity}x</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedBikeIndex(index);
                              setSelectedService({ nome: service, quantidade: quantity });
                              setShowEditServiceModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Remover o serviço ${service}?`)) {
                                try {
                                  await removeOrderService(order.id, index, service);
                                  await loadOrders();
                                } catch (error) {
                                  console.error('Erro ao remover serviço:', error);
                                  alert('Erro ao remover serviço.');
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
   
                <div className="mt-3">
                  <p className="font-bold mb-1">Peças:</p>
                  <ul className="list-disc list-inside">
                    {bike.pecas?.map((peca, idx) => (
                      <li key={idx} className="flex items-center justify-between">
                        <span>{peca.nome} - R$ {peca.valor}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedBikeIndex(index);
                              setSelectedPeca(peca);
                              setShowEditPartModal(true);
                            }}
                            className="text-blue-500 hover:text-blue-600 text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm(`Remover a peça ${peca.nome}?`)) {
                                try {
                                  await removeOrderPart(order.id, index, idx);
                                  await loadOrders();
                                } catch (error) {
                                  console.error('Erro ao remover peça:', error);
                                  alert('Erro ao remover peça.');
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            Remover
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
   
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      setSelectedBikeIndex(index);
                      setShowServiceModal(true);
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    + Serviço
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBikeIndex(index);
                      setShowPartModal(true);
                    }}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    + Peça
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Total da OS:</h3>
              <p className="text-xl font-bold">R$ {order.valorTotal}</p>
            </div>
            {order.observacoes && (
              <div className="mb-4">
                <h3 className="font-bold mb-2">Observações:</h3>
                <p className="text-gray-700">{order.observacoes}</p>
              </div>
            )}
            <div className="flex gap-4">
              <button 
                onClick={() => setShowObsModal(true)}
                className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600"
              >
                {order.observacoes ? 'Editar Observação' : 'Adicionar Observação'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditPartModal && selectedPeca && (
  <EditPartModal
    peca={selectedPeca}
    onClose={() => {
      setShowEditPartModal(false);
      setSelectedPeca(null);
    }}
    onSave={async (updatedPart) => {
      try {
        await updateOrderPart(order.id, selectedBikeIndex, selectedPeca.index, updatedPart);
        await loadOrders();
        setShowEditPartModal(false);
        setSelectedPeca(null);
      } catch (error) {
        console.error('Erro ao atualizar peça:', error);
        alert('Erro ao atualizar peça.');
      }
    }}
    loading={loading}
  />
)}

      {/* Modais de Adição */}
      {showServiceModal && (
        <AddServiceModal 
          onClose={() => setShowServiceModal(false)}
          onAdd={(data) => handleAddService(selectedBikeIndex, data)}
          loading={loading}
        />
      )}

      {showPartModal && (
        <AddPartModal 
          onClose={() => setShowPartModal(false)}
          onAdd={(data) => handleAddPart(selectedBikeIndex, data)}
          loading={loading}
        />
      )}

      {showObsModal && (
        <AddObservationModal 
          onClose={() => setShowObsModal(false)}
          onAdd={handleAddObservation}
          loading={loading}
          currentObservation={order.observacoes}
        />
      )}
    </div>
  );
};

// Modal para editar peça
const EditPartModal = ({ peca, onClose, onSave, loading }) => {
  const [nome, setNome] = useState(peca.nome);
  const [valor, setValor] = useState(peca.valor);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      nome,
      valor: parseFloat(valor)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Editar Peça</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nome da Peça
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Valor
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para adicionar serviço
const AddServiceModal = ({ onClose, onAdd, loading }) => {
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [valor, setValor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      nome,
      quantidade: Number(quantidade),
      valor: Number(valor)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Adicionar Serviço</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Serviço
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Quantidade
              </label>
              <input
                type="number"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Valor Unitário
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para adicionar peça
const AddPartModal = ({ onClose, onAdd, loading }) => {
  const [nome, setNome] = useState('');
  const [valor, setValor] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      nome,
      valor: Number(valor)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Adicionar Peça</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Nome da Peça
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Valor
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border rounded"
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para adicionar observação
const AddObservationModal = ({ onClose, onAdd, loading, currentObservation }) => {
  const [observacao, setObservacao] = useState(currentObservation || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(observacao);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-4">Adicionar Observação</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-3 py-2 border rounded h-32 resize-none"
                placeholder="Digite a observação..."
                required
              />
            </div>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-yellow-500 text-white px-6 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


  // Buscar ordens iniciais
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError('Erro ao carregar ordens');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Adicione esse componente para edição de serviço
const EditServiceModal = ({ service, onClose, onSave, loading }) => {
  const [nome, setNome] = useState(service.nome);
  const [quantidade, setQuantidade] = useState(service.quantidade);
  const [valor, setValor] = useState(service.valor);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      nome,
      quantidade: Number(quantidade),
      valor: Number(valor)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h3 className="text-lg font-bold mb-4">Editar Serviço</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Nome do Serviço
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Quantidade
            </label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              min="1"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Valor Unitário
            </label>
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

  // Handler para atualização de status
  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (sourceColumn === destColumn) return;

    try {
      // Primeiro atualiza localmente para UI responsiva
      const newOrders = { ...orders };
      const movedOrder = orders[sourceColumn].find(order => order.id === draggableId);
      
      newOrders[sourceColumn] = orders[sourceColumn].filter(order => order.id !== draggableId);
      newOrders[destColumn] = [...orders[destColumn], { ...movedOrder, status: destColumn }];

      setOrders(newOrders);

      // Depois atualiza no Firebase
      const status = destColumn === 'pending' ? 'Pendente' 
        : destColumn === 'inProgress' ? 'Em Andamento' 
        : 'Pronto';
      
      await updateOrderStatus(draggableId, status);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Reverte mudanças em caso de erro
      loadOrders();
    }
  };

  // Filtragem de ordens
  const filteredOrders = {
    pending: orders.pending.filter(order => 
      order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.telefone?.includes(searchTerm)
    ),
    inProgress: orders.inProgress.filter(order => 
      order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.telefone?.includes(searchTerm)
    ),
    done: orders.done.filter(order => 
      order.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.cliente?.telefone?.includes(searchTerm)
    )
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="Sport & Bike" className="h-10" />
            <h1 className="ml-4 text-xl font-bold text-[#333]">Ordens de Serviço</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-600 hover:text-[#FFC107] transition-colors"
            >
              Voltar
            </button>
            <button 
              onClick={handleLogout}
              className="text-gray-600 hover:text-[#FFC107] transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Barra de busca */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar OS ou cliente..."
            className="w-full max-w-md px-4 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-[#FFC107]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

     javascriptCopy{/* Grid de colunas */}
<DragDropContext onDragEnd={onDragEnd}>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
   {/* Coluna Pendente */}
   <div>
     <h2 className="text-lg font-bold mb-4 flex items-center">
       <span className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></span>
       Pendente ({filteredOrders.pending.length})
     </h2>
     <Droppable droppableId="pending">
       {(provided) => (
         <div
           ref={provided.innerRef}
           {...provided.droppableProps}
           className="bg-gray-50 p-4 rounded-lg min-h-[200px]"
         >
           {filteredOrders.pending.map((order, index) => (
             <Draggable key={order.id} draggableId={order.id} index={index}>
               {(provided) => (
                 <div
                   ref={provided.innerRef}
                   {...provided.draggableProps}
                   {...provided.dragHandleProps}
                 >
                   <OrderCard order={order} />
                 </div>
               )}
             </Draggable>
           ))}
           {provided.placeholder}
         </div>
       )}
     </Droppable>
   </div>

   {/* Coluna Em Andamento */}
   <div>
     <h2 className="text-lg font-bold mb-4 flex items-center">
       <span className="w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
       Em Andamento ({filteredOrders.inProgress.length})
     </h2>
     <Droppable droppableId="inProgress">
       {(provided) => (
         <div
           ref={provided.innerRef}
           {...provided.droppableProps}
           className="bg-gray-50 p-4 rounded-lg min-h-[200px]"
         >
           {filteredOrders.inProgress.map((order, index) => (
             <Draggable key={order.id} draggableId={order.id} index={index}>
               {(provided) => (
                 <div
                   ref={provided.innerRef}
                   {...provided.draggableProps}
                   {...provided.dragHandleProps}
                 >
                   <OrderCard order={order} />
                 </div>
               )}
             </Draggable>
           ))}
           {provided.placeholder}
         </div>
       )}
     </Droppable>
   </div>

   {/* Coluna Pronto */}
   <div>
     <h2 className="text-lg font-bold mb-4 flex items-center">
       <span className="w-3 h-3 bg-green-400 rounded-full mr-2"></span>
       Pronto ({filteredOrders.done.length})
     </h2>
     <Droppable droppableId="done">
       {(provided) => (
         <div
           ref={provided.innerRef}
           {...provided.droppableProps}
           className="bg-gray-50 p-4 rounded-lg min-h-[200px]"
         >
           {filteredOrders.done.map((order, index) => (
             <Draggable key={order.id} draggableId={order.id} index={index}>
               {(provided) => (
                 <div
                   ref={provided.innerRef}
                   {...provided.draggableProps}
                   {...provided.dragHandleProps}
                 >
                   <OrderCard order={order} />
                 </div>
               )}
             </Draggable>
           ))}
           {provided.placeholder}
         </div>
       )}
     </Droppable>
   </div>
 </div>
</DragDropContext>


      {/* Modal de Detalhes */}
      {showModal && selectedOrder && (
        <OrderDetails order={selectedOrder} />
      )}
       </main>
    </div>
  );
};

export default WorkshopDashboard;